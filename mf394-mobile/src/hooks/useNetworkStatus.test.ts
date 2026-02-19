import { renderHook, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStatus } from './useNetworkStatus';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

describe('useNetworkStatus', () => {
  let mockListener: ((state: any) => void) | null = null;

  beforeEach(() => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
      mockListener = callback;
      return jest.fn(); // unsubscribe
    });
  });

  afterEach(() => {
    mockListener = null;
    jest.clearAllMocks();
  });

  it('returns isOnline: true by default', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('returns isOnline: false when disconnected', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: false, isInternetReachable: false });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('returns isOnline: true when connected and reachable', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: true, isInternetReachable: true });
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('returns isOnline: false when connected but not reachable', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: true, isInternetReachable: false });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates when network state changes', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      mockListener?.({ isConnected: false, isInternetReachable: false });
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      mockListener?.({ isConnected: true, isInternetReachable: true });
    });
    expect(result.current.isOnline).toBe(true);
  });
});
