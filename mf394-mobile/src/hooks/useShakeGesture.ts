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
