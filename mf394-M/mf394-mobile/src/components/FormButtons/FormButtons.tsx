/**
 * FormButtons Component
 *
 * A reusable button group for forms with three button types:
 * - Primary button (blue): Main action like Save, Add, Crop (optional)
 * - Delete button (red): Destructive action like Delete (optional)
 * - Cancel button (brown/beige): Secondary action like Cancel or Back (always visible)
 *
 * Layout: Single-column, full-width buttons stacked vertically
 * - Primary button (if provided)
 * - Delete button (if provided)
 * - Spacer
 * - Cancel button
 *
 * Features:
 * - Only renders primary and delete buttons when provided
 * - Cancel button is always visible
 * - Each button can have its own loading state
 * - All buttons are disabled when any button is loading
 * - Supports custom labels and icons for all buttons
 * - Full-width buttons for better mobile UX
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

/**
 * Configuration for a single button
 */
export interface ButtonConfig {
  /** Button label text */
  label: string;
  /** FontAwesome icon name (optional) */
  icon?: string;
  /** Button press handler */
  onPress: () => void;
  /** Loading state for this specific button */
  isLoading?: boolean;
  /** Disabled state for this specific button */
  disabled?: boolean;
}

/**
 * Props for FormButtons component
 */
export interface FormButtonsProps {
  /** Primary action button (blue) - optional, e.g., Save, Add, Crop */
  primaryButton?: ButtonConfig;
  /** Delete action button (red) - optional, e.g., Delete */
  deleteButton?: ButtonConfig;
  /** Cancel/Back button (brown/beige) - always visible, e.g., Cancel, Back */
  cancelButton: ButtonConfig;
}

export const FormButtons: React.FC<FormButtonsProps> = ({
  primaryButton,
  deleteButton,
  cancelButton,
}) => {
  // Determine if any button is loading
  const isAnyLoading =
    primaryButton?.isLoading || deleteButton?.isLoading || cancelButton?.isLoading;

  return (
    <View style={styles.container}>
      {/* Primary Button (Blue) */}
      {primaryButton && (
        <TouchableOpacity
          testID="primary-button"
          style={[
            styles.primaryButton,
            (isAnyLoading || primaryButton.disabled) && styles.buttonDisabled,
          ]}
          onPress={primaryButton.onPress}
          disabled={isAnyLoading || primaryButton.disabled}
        >
          {primaryButton.isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {primaryButton.icon && (
                <FontAwesome
                  name={primaryButton.icon as any}
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
              )}
              <Text style={styles.primaryButtonText}>{primaryButton.label}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Delete Button (Red) */}
      {deleteButton && (
        <TouchableOpacity
          testID="delete-button"
          style={[
            styles.deleteButton,
            (isAnyLoading || deleteButton.disabled) && styles.buttonDisabled,
          ]}
          onPress={deleteButton.onPress}
          disabled={isAnyLoading || deleteButton.disabled}
        >
          {deleteButton.isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {deleteButton.icon && (
                <FontAwesome
                  name={deleteButton.icon as any}
                  size={18}
                  color="#fff"
                  style={deleteButton.label ? styles.buttonIcon : undefined}
                />
              )}
              {deleteButton.label && (
                <Text style={styles.deleteButtonText}>{deleteButton.label}</Text>
              )}
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Cancel/Back button */}
      <TouchableOpacity
        testID="cancel-button"
        style={[
          styles.cancelButton,
          (isAnyLoading || cancelButton.disabled) && styles.buttonDisabled,
        ]}
        onPress={cancelButton.onPress}
        disabled={isAnyLoading || cancelButton.disabled}
      >
        {cancelButton.isLoading ? (
          <ActivityIndicator color={colors.semantic.text} size="small" />
        ) : (
          <>
            {cancelButton.icon && (
              <FontAwesome
                name={cancelButton.icon as any}
                size={18}
                color={colors.semantic.text}
                style={styles.buttonIcon}
              />
            )}
            <Text style={styles.cancelButtonText}>{cancelButton.label}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  spacer: {
    height: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.large.fontSize,
  },
  deleteButton: {
    backgroundColor: colors.semantic.error,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.large.fontSize,
  },
  cancelButton: {
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  cancelButtonText: {
    color: colors.semantic.text,
    fontWeight: '600',
    fontSize: typography.body.large.fontSize,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
