/**
 * useOnboarding
 *
 * Manages onboarding state for iOS and Android.
 * Fetches slide data from a remote JSON, validates it with Zod, caches it
 * locally, and tracks completion per-platform in AsyncStorage.
 * Web is always bypassed.
 *
 * Failure hierarchy:
 *   1. Remote fetch + valid JSON  → use it, update cache
 *   2. Remote fetch + invalid JSON → fall through to cache
 *   3. No/stale cache             → silently skip onboarding
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

const ONBOARDING_URL = 'https://ummyou.com/onboarding.json';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const STORAGE_KEYS = {
  completedIos: '@onboarding_completed_ios',
  completedAndroid: '@onboarding_completed_android',
  jsonCache: '@onboarding_json_cache',
  jsonCacheTime: '@onboarding_json_cache_time',
} as const;

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const RawSlideSchema = z.object({
  id: z.number(),
  imageI: z.string().optional().default(''),
  imageA: z.string().optional().default(''),
  header: z.string().nullable().optional().default(null),
  body: z.string().nullable().optional().default(null),
  buttonText: z.string().min(1),
  showSkip: z.boolean(),
  primaryAction: z.string().optional(),
});

const RawOnboardingJsonSchema = z.object({
  onboardingScreens: z.array(RawSlideSchema).min(1),
});

const NormalizedSlideSchema = z.object({
  image: z.string(),
  header: z.string().nullable(),
  body: z.string().nullable(),
  buttonText: z.string().min(1),
  showSkip: z.boolean(),
});

const NormalizedSlidesSchema = z.array(NormalizedSlideSchema).min(1);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Normalized shape used throughout the app */
export interface OnboardingSlideData {
  image: string;
  header: string | null;
  body: string | null;
  buttonText: string;
  showSkip: boolean;
}

export interface UseOnboardingReturn {
  isLoading: boolean;
  needsOnboarding: boolean;
  screens: OnboardingSlideData[];
  currentIndex: number;
  isLastSlide: boolean;
  transitioning: boolean;
  goNext: () => void;
  markComplete: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPlatformKey(): string {
  return Platform.OS === 'ios'
    ? STORAGE_KEYS.completedIos
    : STORAGE_KEYS.completedAndroid;
}

/**
 * Parses and validates the remote JSON, returning normalized slides.
 * Throws if the JSON doesn't match the expected schema.
 */
function parseRemoteJson(raw: unknown): OnboardingSlideData[] {
  const result = RawOnboardingJsonSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid onboarding JSON: ${result.error.message}`);
  }
  return result.data.onboardingScreens.map((slide) => ({
    image: Platform.OS === 'ios' ? slide.imageI : slide.imageA,
    header: slide.header ?? null,
    body: slide.body ?? null,
    buttonText: slide.buttonText,
    showSkip: slide.showSkip,
  }));
}

/**
 * Reads the fresh cache (within TTL). Returns null if absent or expired.
 * Also validates the cached shape — returns null on corruption.
 */
async function loadFromCache(): Promise<OnboardingSlideData[] | null> {
  const cacheTimeStr = await AsyncStorage.getItem(STORAGE_KEYS.jsonCacheTime);
  if (!cacheTimeStr) return null;
  const cacheAge = Date.now() - new Date(cacheTimeStr).getTime();
  if (cacheAge >= CACHE_TTL_MS) return null;
  return loadAndValidateCacheEntry();
}

/**
 * Reads the stale cache regardless of TTL.
 * Returns null on absence or corruption.
 */
async function loadStaleCache(): Promise<OnboardingSlideData[] | null> {
  return loadAndValidateCacheEntry();
}

async function loadAndValidateCacheEntry(): Promise<OnboardingSlideData[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.jsonCache);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = NormalizedSlidesSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function saveCache(data: OnboardingSlideData[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.jsonCache, JSON.stringify(data));
  await AsyncStorage.setItem(STORAGE_KEYS.jsonCacheTime, new Date().toISOString());
}

function startPrefetch(
  slides: OnboardingSlideData[],
  readyImages: Set<number>,
  prefetchPromises: Map<number, Promise<boolean>>,
): void {
  slides.forEach((slide, index) => {
    if (slide.image) {
      const promise = Image.prefetch(slide.image)
        .then(() => { readyImages.add(index); return true; })
        .catch(() => { readyImages.add(index); return false; });
      prefetchPromises.set(index, promise);
    } else {
      readyImages.add(index);
    }
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOnboarding(): UseOnboardingReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [screens, setScreens] = useState<OnboardingSlideData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const readyImages = useRef(new Set<number>()).current;
  const prefetchPromises = useRef(new Map<number, Promise<boolean>>()).current;

  const markComplete = useCallback(async () => {
    if (Platform.OS === 'web') return;
    await AsyncStorage.setItem(getPlatformKey(), 'true');
    setNeedsOnboarding(false);
  }, []);

  const goNext = useCallback(async () => {
    const next = currentIndex + 1;
    if (readyImages.has(next)) {
      setCurrentIndex(next);
    } else {
      setTransitioning(true);
      const promise = prefetchPromises.get(next);
      if (promise) await promise;
      setTransitioning(false);
      setCurrentIndex(next);
    }
  }, [currentIndex, readyImages, prefetchPromises]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const completed = await AsyncStorage.getItem(getPlatformKey());
        if (completed === 'true') {
          if (!cancelled) setIsLoading(false);
          return;
        }

        // Try fresh cache first (avoids a network round-trip)
        const cached = await loadFromCache();
        if (cached) {
          startPrefetch(cached, readyImages, prefetchPromises);
          if (!cancelled) {
            setScreens(cached);
            setNeedsOnboarding(true);
            setIsLoading(false);
          }
          return;
        }

        // Fetch remote — throws on network error OR invalid JSON schema
        try {
          const response = await fetch(ONBOARDING_URL);
          const raw: unknown = await response.json();
          const data = parseRemoteJson(raw);
          await saveCache(data);
          startPrefetch(data, readyImages, prefetchPromises);
          if (!cancelled) {
            setScreens(data);
            setNeedsOnboarding(true);
            setIsLoading(false);
          }
        } catch {
          // Network error or corrupt JSON — fall back to stale cache
          const stale = await loadStaleCache();
          if (stale) {
            startPrefetch(stale, readyImages, prefetchPromises);
            if (!cancelled) {
              setScreens(stale);
              setNeedsOnboarding(true);
              setIsLoading(false);
            }
          } else {
            // Nothing usable — silently skip onboarding
            await AsyncStorage.setItem(getPlatformKey(), 'true');
            if (!cancelled) setIsLoading(false);
          }
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    needsOnboarding,
    screens,
    currentIndex,
    isLastSlide: screens.length > 0 && currentIndex === screens.length - 1,
    transitioning,
    goNext,
    markComplete,
  };
}
