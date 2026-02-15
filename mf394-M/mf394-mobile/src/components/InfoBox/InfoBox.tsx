/**
 * InfoBox Component
 *
 * A reusable informational box with icon and text.
 * Used to display tips, instructions, or contextual information.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface InfoBoxProps {
  /** The text content to display */
  text: string;
  /** FontAwesome icon name */
  icon?: string;
  /** Icon color (defaults to primary) */
  iconColor?: string;
  /** Optional custom styles */
  style?: ViewStyle;
}

export function InfoBox({ text, icon = 'info-circle', iconColor, style }: InfoBoxProps) {
  const finalIconColor = iconColor || colors.primary[500];

  return (
    <View style={[styles.container, style]}>
      <FontAwesome name={icon as any} size={20} color={finalIconColor} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.semantic.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  text: {
    flex: 1,
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
  },
});
