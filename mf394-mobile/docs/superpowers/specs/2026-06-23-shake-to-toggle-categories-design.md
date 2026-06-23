# Shake to Toggle Categories Design

**Date:** 2026-06-23
**Goal:** Shaking the phone on the Listing screen triggers the same action as long-pressing a category button — toggle all categories selected/deselected — with haptic feedback.

---

## Architecture

Two units:

### `src/hooks/useShakeGesture.ts`
Pure logic hook. Subscribes to `expo-sensors` Accelerometer, runs the peak-counting shake detection algorithm, fires a caller-supplied callback when a deliberate shake is detected.

**Interface:**
```ts
function useShakeGesture(options: {
  onShake: () => void;
  enabled: boolean;
}): void
```

No JSX. No Redux. No knowledge of what the shake does — it only detects and reports.

### `src/screens/Listing/ListingScreen.tsx`
Calls `useShakeGesture` with:
- `onShake`: fires `Haptics.notificationAsync(Success)` then `handleCategoryLongPress()`
- `enabled`: `useIsFocused()` from React Navigation — pauses the accelerometer when the screen is not active

No other files change.

---

## Shake Detection Algorithm

Implemented inside `useShakeGesture`:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Sample rate | 60Hz (16ms interval) | Smooth enough to catch fast motion |
| Threshold | 12 m/s² net (after stripping 9.8 gravity) | ~1.2g — firm shake, not walking noise |
| Peak window | 600ms | Back-and-forth-and-back within half a second |
| Peak count to fire | 3 | Requires deliberate oscillation |
| Cooldown after fire | 1500ms | Prevents double-trigger |

**Algorithm:**
1. `Accelerometer.setUpdateInterval(16)`
2. On each sample: `magnitude = sqrt(x² + y² + z²) - 9.8`
3. If `magnitude > 12`: push current timestamp into `peaks[]`
4. Prune `peaks` older than 600ms
5. If `peaks.length >= 3` and not in cooldown: fire `onShake()`, set cooldown timestamp
6. Unsubscribe on unmount or when `enabled` becomes false

All thresholds are module-level constants — easy to tune if real-world testing shows they're off.

---

## Haptic Feedback

Called in `ListingScreen` immediately before `handleCategoryLongPress`:

```ts
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
```

- iOS: double-tap pattern (system "success" feedback)
- Android: short vibration
- Web: no-op (expo-haptics gracefully does nothing)

Only fires once per shake event — no haptic during cooldown period.

---

## What Doesn't Change

- `handleCategoryLongPress` logic is unchanged
- No Redux slices modified
- No new components
- No changes to any screen other than `ListingScreen.tsx`

---

## Success Criteria

- Deliberate shake (3 peaks / 600ms) on Listing screen toggles all categories
- Haptic fires once per shake
- Walking, setting phone down, gentle movement does not trigger
- Navigating away from Listing screen stops the accelerometer
- Returning to Listing screen resumes it
- Hook is independently testable with a mock `onShake` callback
- Web build is unaffected
