/**
 * Filter Cache
 *
 * Persists category/tag filter selections to AsyncStorage with a timestamp.
 * On app resume or cold start, filters are restored only if backgrounded
 * less than FILTER_EXPIRY_MS ago.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FILTER_CACHE_KEY = 'filter_cache';
export const FILTER_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface FilterSnapshot {
  selectedCategories: string[];
  selectedTags: string[];
  backgroundedAt: number;
}

export async function saveFilterSnapshot(
  selectedCategories: string[],
  selectedTags: string[],
): Promise<void> {
  try {
    const snapshot: FilterSnapshot = {
      selectedCategories,
      selectedTags,
      backgroundedAt: Date.now(),
    };
    await AsyncStorage.setItem(FILTER_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Silent failure — cache is best-effort
  }
}

export async function loadFilterSnapshot(): Promise<FilterSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(FILTER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed?.selectedCategories) &&
      Array.isArray(parsed?.selectedTags) &&
      typeof parsed?.backgroundedAt === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearFilterSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FILTER_CACHE_KEY);
  } catch {
    // Silent failure
  }
}
