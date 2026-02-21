/**
 * OfflineBanner
 *
 * Displays a persistent banner at the top of the screen when the device
 * has no internet connection. Hidden when online.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { colors, spacing, typography, shadows } from '../../theme/theme';

export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.semantic.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  text: {
    color: colors.neutral.bone[50],
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
  },
});
