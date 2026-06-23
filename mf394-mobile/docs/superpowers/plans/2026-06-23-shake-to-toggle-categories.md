# Shake to Toggle Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shaking the phone on the Listing screen fires the same toggle-all-categories action as long-pressing a category button, with haptic feedback.

**Architecture:** A new `useShakeGesture` hook encapsulates all accelerometer logic (peak-counting algorithm, cooldown, cleanup). `ListingScreen` calls the hook with `onShake` and `enabled={isFocused}`, then wires haptics + the existing `handleCategoryLongPress` handler into `onShake`.

**Tech Stack:** `expo-sensors` (Accelerometer), `expo-haptics` (already installed), `@react-navigation/native` useIsFocused (already installed), Jest + React Native Testing Library

---

## File Map

| File | Action |
|------|--------|
| `src/hooks/useShakeGesture.ts` | Create — shake detection hook |
| `src/hooks/useShakeGesture.test.ts` | Create — unit tests |
| `src/screens/Listing/ListingScreen.tsx` | Modify — wire up hook |

---

## Task 1: Install expo-sensors

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install expo-sensors**

```bash
npm install expo-sensors
```

- [ ] **Step 2: Verify installation**

```bash
ls node_modules/expo-sensors/build/Accelerometer.js
```
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-sensors for shake detection"
```

---

## Task 2: Build useShakeGesture hook (TDD)

**Files:**
- Create: `src/hooks/useShakeGesture.ts`
- Create: `src/hooks/useShakeGesture.test.ts`

### Algorithm constants (used in both files)

```ts
const SAMPLE_INTERVAL_MS = 16;       // 60Hz
const MAGNITUDE_THRESHOLD = 12;      // m/s² net (after stripping gravity)
const GRAVITY = 9.8;
const PEAK_WINDOW_MS = 600;          // sliding window
const PEAKS_REQUIRED = 3;            // peaks needed to fire
const COOLDOWN_MS = 1500;            // silence after firing
```

---

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useShakeGesture.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useShakeGesture } from './useShakeGesture';

// Mock expo-sensors
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
}));

describe('useShakeGesture', () => {
  let listenerCallback: ((data: { x: number; y: number; z: number }) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (Accelerometer.addListener as jest.Mock).mockImplementation((cb) => {
      listenerCallback = cb;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const simulatePeak = () => {
    // x=15, y=0, z=9.8 → magnitude = sqrt(225 + 0 + 96.04) - 9.8 ≈ 17.9 - 9.8 = 8.1
    // Use stronger values: x=20, y=5, z=9.8 → sqrt(400+25+96.04)-9.8 ≈ 22.4-9.8 = 12.6 > 12
    act(() => { listenerCallback?.({ x: 20, y: 5, z: 9.8 }); });
  };

  const simulateIdle = () => {
    act(() => { listenerCallback?.({ x: 0, y: 0, z: 9.8 }); });
  };

  it('sets accelerometer update interval to 16ms when enabled', () => {
    renderHook(() => useShakeGesture({ onShake: jest.fn(), enabled: true }));
    expect(Accelerometer.setUpdateInterval).toHaveBeenCalledWith(16);
  });

  it('subscribes to accelerometer when enabled', () => {
    renderHook(() => useShakeGesture({ onShake: jest.fn(), enabled: true }));
    expect(Accelerometer.addListener).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe when disabled', () => {
    renderHook(() => useShakeGesture({ onShake: jest.fn(), enabled: false }));
    expect(Accelerometer.addListener).not.toHaveBeenCalled();
  });

  it('fires onShake after 3 peaks within 600ms', () => {
    const onShake = jest.fn();
    renderHook(() => useShakeGesture({ onShake, enabled: true }));

    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();

    expect(onShake).toHaveBeenCalledTimes(1);
  });

  it('does not fire when peaks are spread beyond 600ms window', () => {
    const onShake = jest.fn();
    renderHook(() => useShakeGesture({ onShake, enabled: true }));

    simulatePeak();
    jest.advanceTimersByTime(300);
    simulatePeak();
    jest.advanceTimersByTime(301); // first peak now outside 600ms window
    simulatePeak();

    expect(onShake).not.toHaveBeenCalled();
  });

  it('does not fire during cooldown period', () => {
    const onShake = jest.fn();
    renderHook(() => useShakeGesture({ onShake, enabled: true }));

    // First shake
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    expect(onShake).toHaveBeenCalledTimes(1);

    // Immediately shake again — within cooldown
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    expect(onShake).toHaveBeenCalledTimes(1); // still 1
  });

  it('fires again after cooldown expires', () => {
    const onShake = jest.fn();
    renderHook(() => useShakeGesture({ onShake, enabled: true }));

    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    expect(onShake).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1500); // cooldown expires

    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    jest.advanceTimersByTime(100);
    simulatePeak();
    expect(onShake).toHaveBeenCalledTimes(2);
  });

  it('does not fire for low-magnitude movement', () => {
    const onShake = jest.fn();
    renderHook(() => useShakeGesture({ onShake, enabled: true }));

    // Walking noise: small x/y variation, gravity on z
    for (let i = 0; i < 10; i++) {
      simulateIdle();
      jest.advanceTimersByTime(50);
    }

    expect(onShake).not.toHaveBeenCalled();
  });

  it('removes listener on unmount', () => {
    const removeMock = jest.fn();
    (Accelerometer.addListener as jest.Mock).mockReturnValue({ remove: removeMock });

    const { unmount } = renderHook(() =>
      useShakeGesture({ onShake: jest.fn(), enabled: true })
    );
    unmount();

    expect(removeMock).toHaveBeenCalledTimes(1);
  });

  it('removes listener when enabled flips to false', () => {
    const removeMock = jest.fn();
    (Accelerometer.addListener as jest.Mock).mockReturnValue({ remove: removeMock });

    const { rerender } = renderHook(
      ({ enabled }) => useShakeGesture({ onShake: jest.fn(), enabled }),
      { initialProps: { enabled: true } }
    );

    rerender({ enabled: false });

    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- --testPathPattern="useShakeGesture" --no-coverage
```
Expected: FAIL — `Cannot find module './useShakeGesture'`

- [ ] **Step 3: Implement useShakeGesture.ts**

Create `src/hooks/useShakeGesture.ts`:

```ts
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

const SAMPLE_INTERVAL_MS = 16;
const MAGNITUDE_THRESHOLD = 12;
const GRAVITY = 9.8;
const PEAK_WINDOW_MS = 600;
const PEAKS_REQUIRED = 3;
const COOLDOWN_MS = 1500;

interface UseShakeGestureOptions {
  onShake: () => void;
  enabled: boolean;
}

export function useShakeGesture({ onShake, enabled }: UseShakeGestureOptions): void {
  const peaksRef = useRef<number[]>([]);
  const cooldownUntilRef = useRef<number>(0);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now();
      const magnitude = Math.sqrt(x * x + y * y + z * z) - GRAVITY;

      if (magnitude > MAGNITUDE_THRESHOLD) {
        peaksRef.current.push(now);
      }

      // Prune peaks outside the sliding window
      peaksRef.current = peaksRef.current.filter(
        (t) => now - t <= PEAK_WINDOW_MS
      );

      if (peaksRef.current.length >= PEAKS_REQUIRED && now >= cooldownUntilRef.current) {
        cooldownUntilRef.current = now + COOLDOWN_MS;
        peaksRef.current = [];
        onShakeRef.current();
      }
    });

    return () => {
      subscription.remove();
      peaksRef.current = [];
    };
  }, [enabled]);
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- --testPathPattern="useShakeGesture" --no-coverage
```
Expected: all 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useShakeGesture.ts src/hooks/useShakeGesture.test.ts
git commit -m "feat: add useShakeGesture hook with peak-counting algorithm"
```

---

## Task 3: Wire shake into ListingScreen

**Files:**
- Modify: `src/screens/Listing/ListingScreen.tsx`

- [ ] **Step 1: Add imports to ListingScreen.tsx**

At the top of `src/screens/Listing/ListingScreen.tsx`, add these two imports after the existing imports:

```ts
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useShakeGesture } from '../../hooks/useShakeGesture';
```

- [ ] **Step 2: Add isFocused and shake handler inside the component**

Inside the `ListingScreen` function body, after the existing `handleCategoryLongPress` declaration (around line 96), add:

```ts
const isFocused = useIsFocused();

const handleShake = async () => {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  handleCategoryLongPress();
};

useShakeGesture({ onShake: handleShake, enabled: isFocused });
```

- [ ] **Step 3: Verify the file still compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors related to ListingScreen or useShakeGesture

- [ ] **Step 4: Run the app on a device or simulator and manually test**

```bash
npx expo start --port 8081
```

On iOS Simulator: Hardware → Shake Gesture (⌘ + Ctrl + Z)
On Android Emulator: ... menu → Virtual sensors → Move

Expected:
- Categories toggle (all selected → all cleared, or vice versa)
- Haptic feedback fires once
- Shaking repeatedly within 1.5s does not re-trigger

- [ ] **Step 5: Commit**

```bash
git add src/screens/Listing/ListingScreen.tsx
git commit -m "feat: wire shake gesture to toggle categories in ListingScreen"
```
