/**
 * FormGroup Component
 *
 * A standardized wrapper for form sections providing consistent spacing.
 * Used to group related form inputs, labels, and controls.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../theme/theme';

export interface FormGroupProps {
  /** Child components to render inside the form group */
  children: React.ReactNode;
  /** Optional custom styles to apply to the container */
  style?: ViewStyle;
}

export function FormGroup({ children, style }: FormGroupProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
});
