/**
 * TagButton Component
 *
 * A reusable tag button with selected state.
 * Used in TagSelector and filter UIs for consistent tag display.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface TagButtonProps {
  /** Tag label to display */
  label: string;
  /** Whether the tag is selected */
  selected: boolean;
  /** Callback when tag is pressed */
  onPress: () => void;
  /** Optional custom container styles */
  style?: ViewStyle;
  /** Optional custom text styles */
  textStyle?: TextStyle;
}

export function TagButton({ label, selected, onPress, style, textStyle }: TagButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, selected && styles.buttonSelected, style]}
      onPress={onPress}
    >
      <Text
        style={[styles.label, selected && styles.labelSelected, textStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: radii.xl,
    backgroundColor: colors.semantic.surface,
  },
  buttonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  label: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  labelSelected: {
    color: colors.primary[500],
  },
});
