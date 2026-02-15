/**
 * Toast Component
 *
 * Simple notification toast that auto-dismisses after a set duration.
 * Supports success, error, and info variants.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';

export interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number; // milliseconds
  onDismiss?: () => void;
  visible?: boolean;
}

export function Toast({
  message,
  variant = 'info',
  duration = 3000,
  onDismiss,
  visible = true,
}: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Fade in and slide down
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    // Fade out and slide up
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) {
    return null;
  }

  const getIconName = () => {
    switch (variant) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      case 'info':
      default:
        return 'info-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colors.semantic.success;
      case 'error':
        return colors.semantic.error;
      case 'info':
      default:
        return colors.semantic.info;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <FontAwesome name={getIconName()} size={20} color="#fff" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.huge,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    ...shadows.lg,
    zIndex: 9999,
  },
  message: {
    flex: 1,
    fontSize: typography.body.medium.fontSize,
    lineHeight: typography.body.medium.lineHeight,
    fontWeight: '600',
    color: '#fff',
  },
});
