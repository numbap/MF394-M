/**
 * OnboardingDots
 *
 * Progress indicator showing the current slide position.
 * Active dot uses primary brand color; inactive dots use neutral.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radii } from '../../theme/theme';

interface Props {
  total: number;
  current: number;
}

export const OnboardingDots = ({ total, current }: Props) => {
  return (
    <View style={styles.container} accessibilityLabel={`Slide ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === current ? styles.dotActive : styles.dotInactive]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.full,
  },
  dotActive: {
    backgroundColor: colors.primary[500],
  },
  dotInactive: {
    backgroundColor: colors.neutral.iron[200],
  },
});
