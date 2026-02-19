/**
 * useNetworkStatus
 *
 * Tracks network connectivity using @react-native-community/netinfo.
 * Returns whether the device is online and can reach the internet.
 */

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
  }, []);

  return {
    isOnline: isConnected && isInternetReachable,
    isConnected,
    isInternetReachable,
  };
};
