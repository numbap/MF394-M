/**
 * LoadingState Component
 *
 * A standardized loading screen with spinner, title, and subtitle.
 * Used for face detection, image processing, and other loading states.
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme/theme';

export interface LoadingStateProps {
  /** Main loading message */
  title: string;
  /** Optional subtitle for additional context */
  subtitle?: string;
  /** Optional custom styles */
  style?: ViewStyle;
}

export function LoadingState({ title, subtitle, style }: LoadingStateProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={48} color={colors.primary[500]} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.title.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
  },
  subtitle: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
  },
});
