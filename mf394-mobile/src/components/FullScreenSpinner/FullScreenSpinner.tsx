/**
 * FullScreenSpinner
 *
 * A blocking full-screen overlay with:
 * - Loading state: centered spinner with text
 * - Error state: error message with back button
 *
 * Used during save operations to prevent interaction
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface FullScreenSpinnerProps {
  visible: boolean;
  variant?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  onBack?: () => void;
}

export function FullScreenSpinner({
  visible,
  variant = 'loading',
  message = 'Saving...',
  errorMessage = 'An error occurred',
  onBack,
}: FullScreenSpinnerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {variant === 'loading' ? (
            <>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.message}>{message}</Text>
            </>
          ) : (
            <>
              <View style={styles.errorIcon}>
                <FontAwesome
                  name="exclamation-circle"
                  size={48}
                  color={colors.semantic.error}
                />
              </View>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              {onBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                  <FontAwesome name="arrow-left" size={16} color="#fff" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    minWidth: 280,
    alignItems: 'center',
    gap: spacing.lg,
  },
  message: {
    fontSize: typography.body.large.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
    textAlign: 'center',
  },
  errorIcon: {
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.body.large.fontSize,
    fontWeight: '600',
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minWidth: 120,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.body.medium.fontSize,
  },
});
