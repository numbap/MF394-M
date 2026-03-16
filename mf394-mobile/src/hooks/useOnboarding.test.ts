import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Image } from 'react-native';
import { useOnboarding, OnboardingSlideData } from './useOnboarding';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/** Raw JSON shape from the remote endpoint */
const mockRawJson = {
  onboardingScreens: [
    {
      id: 1,
      imageI: 'https://example.com/ios-slide1.png',
      imageA: 'https://example.com/android-slide1.png',
      header: 'Welcome',
      body: 'Get started',
      buttonText: 'Next',
      showSkip: true,
      primaryAction: 'next',
    },
    {
      id: 2,
      imageI: 'https://example.com/ios-slide2.png',
      imageA: 'https://example.com/android-slide2.png',
      header: 'Step 2',
      body: 'Learn more',
      buttonText: 'Get Started',
      showSkip: false,
      primaryAction: 'finish',
    },
  ],
};

/** Normalized slides as stored in cache (iOS images, since tests run on iOS) */
const mockSlides: OnboardingSlideData[] = [
  {
    image: 'https://example.com/ios-slide1.png',
    header: 'Welcome',
    body: 'Get started',
    buttonText: 'Next',
    showSkip: true,
  },
  {
    image: 'https://example.com/ios-slide2.png',
    header: 'Step 2',
    body: 'Learn more',
    buttonText: 'Get Started',
    showSkip: false,
  },
];

beforeEach(() => {
  AsyncStorage.clear();
  jest.clearAllMocks();
  // Default: iOS platform
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  // Default: Image.prefetch resolves immediately
  jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
});

describe('useOnboarding — web bypass', () => {
  it('returns needsOnboarding=false on web without fetching', async () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'web',
      configurable: true,
    });
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.needsOnboarding).toBe(false);
  });
});

describe('useOnboarding — completion key set', () => {
  it('skips onboarding when completion key already exists for ios', async () => {
    await AsyncStorage.setItem('@onboarding_completed_ios', 'true');
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.needsOnboarding).toBe(false);
  });
});

describe('useOnboarding — remote fetch success', () => {
  it('fetches JSON and sets needsOnboarding=true', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockRawJson),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.screens).toHaveLength(2);
    expect(result.current.screens[0].header).toBe('Welcome');
  });

  it('uses imageI (iOS image) on iOS', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockRawJson),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.screens[0].image).toBe('https://example.com/ios-slide1.png');
  });

  it('uses imageA (Android image) on Android', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockRawJson),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.screens[0].image).toBe('https://example.com/android-slide1.png');
  });
});

describe('useOnboarding — corrupt/invalid remote JSON', () => {
  it('falls back to stale cache when remote JSON is missing onboardingScreens', async () => {
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await AsyncStorage.setItem('@onboarding_json_cache', JSON.stringify(mockSlides));
    await AsyncStorage.setItem('@onboarding_json_cache_time', oldTime);

    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ wrong: 'shape' }),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.screens).toHaveLength(2);
  });

  it('falls back to stale cache when remote JSON is an empty array', async () => {
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await AsyncStorage.setItem('@onboarding_json_cache', JSON.stringify(mockSlides));
    await AsyncStorage.setItem('@onboarding_json_cache_time', oldTime);

    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ onboardingScreens: [] }),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.screens).toHaveLength(2);
  });

  it('silently skips when JSON is corrupt and no cache exists', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ bad: true }),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(false);
    const stored = await AsyncStorage.getItem('@onboarding_completed_ios');
    expect(stored).toBe('true');
  });

  it('uses fresh cache when JSON is corrupt (ignores corrupt remote)', async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('@onboarding_json_cache', JSON.stringify(mockSlides));
    await AsyncStorage.setItem('@onboarding_json_cache_time', now);

    // fresh cache is used before fetch is attempted, so fetch won't be called
    global.fetch = jest.fn() as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.screens).toHaveLength(2);
  });

  it('returns null for slide fields with missing imageI/imageA (defaults to empty string)', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          onboardingScreens: [
            {
              id: 1,
              // imageI and imageA omitted
              header: 'No image slide',
              body: 'Body text',
              buttonText: 'Next',
              showSkip: false,
              primaryAction: 'next',
            },
          ],
        }),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.screens[0].image).toBe('');
  });

  it('treats corrupt cached JSON as a cache miss', async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('@onboarding_json_cache', 'not valid json {{{{');
    await AsyncStorage.setItem('@onboarding_json_cache_time', now);

    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(mockRawJson),
    }) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.screens).toHaveLength(2);
  });
});

describe('useOnboarding — cache', () => {
  it('uses fresh cache instead of fetching', async () => {
    const now = new Date().toISOString();
    // Cache stores already-normalized slides
    await AsyncStorage.setItem('@onboarding_json_cache', JSON.stringify(mockSlides));
    await AsyncStorage.setItem('@onboarding_json_cache_time', now);

    global.fetch = jest.fn() as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.screens).toHaveLength(2);
  });

  it('uses stale cache when fetch fails', async () => {
    // Expired cache time
    const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    await AsyncStorage.setItem('@onboarding_json_cache', JSON.stringify(mockSlides));
    await AsyncStorage.setItem('@onboarding_json_cache_time', oldTime);

    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.screens).toHaveLength(2);
  });

  it('silently marks complete when fetch fails and no cache exists', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.needsOnboarding).toBe(false);
    const stored = await AsyncStorage.getItem('@onboarding_completed_ios');
    expect(stored).toBe('true');
  });
});

describe('useOnboarding — navigation', () => {
  beforeEach(() => {
    jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockRawJson),
    }) as jest.Mock;
  });

  it('goNext advances currentIndex when image is ready', async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentIndex).toBe(0);
    await act(async () => { await result.current.goNext(); });
    expect(result.current.currentIndex).toBe(1);
  });

  it('isLastSlide is true on last slide', async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.goNext(); });
    expect(result.current.isLastSlide).toBe(true);
  });

  it('isLastSlide is false on first slide', async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLastSlide).toBe(false);
  });

  it('goNext waits for prefetch when image is not yet ready', async () => {
    let resolvePrefetch!: (v: boolean) => void;
    const pendingPrefetch = new Promise<boolean>((resolve) => {
      resolvePrefetch = resolve;
    });

    // First call (slide 0) resolves immediately, second (slide 1) is pending
    (Image.prefetch as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockReturnValueOnce(pendingPrefetch);

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.transitioning).toBe(false);

    let goNextDone = false;
    act(() => {
      result.current.goNext().then(() => { goNextDone = true; });
    });

    // Should be transitioning while waiting
    await waitFor(() => expect(result.current.transitioning).toBe(true));
    expect(result.current.currentIndex).toBe(0);

    // Resolve the prefetch
    await act(async () => { resolvePrefetch(true); });

    await waitFor(() => expect(result.current.transitioning).toBe(false));
    expect(result.current.currentIndex).toBe(1);
  });

  it('goNext advances even when prefetch fails', async () => {
    (Image.prefetch as jest.Mock)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => { await result.current.goNext(); });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.transitioning).toBe(false);
  });

  it('transitioning defaults to false', async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.transitioning).toBe(false);
  });
});

describe('useOnboarding — markComplete', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(mockRawJson),
    }) as jest.Mock;
  });

  it('writes ios key and flips needsOnboarding to false', async () => {
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.markComplete();
    });

    expect(result.current.needsOnboarding).toBe(false);
    const stored = await AsyncStorage.getItem('@onboarding_completed_ios');
    expect(stored).toBe('true');
  });

  it('writes android key when on android', async () => {
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });
    const { result } = renderHook(() => useOnboarding());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.markComplete();
    });

    const stored = await AsyncStorage.getItem('@onboarding_completed_android');
    expect(stored).toBe('true');
  });
});
