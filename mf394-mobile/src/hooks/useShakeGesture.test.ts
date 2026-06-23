import { renderHook, act } from '@testing-library/react-native';
import { Accelerometer } from 'expo-sensors';
import { useShakeGesture } from './useShakeGesture';

// Mock expo-sensors
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
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
    // x=20, y=5, z=9.8 → sqrt(400+25+96.04) = sqrt(521.04) ≈ 22.83-9.8 = 13.03 > 12
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
