/**
 * OnboardingScreen
 *
 * Shows the Super-Connector gauge motivating users to add 30 contacts.
 * Displayed as a modal overlay until dismissed or contact count reaches 31+.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SuperConnectorGauge } from '../../components/SuperConnectorGauge';
import { colors, spacing, typography } from '../../theme/theme';

interface Props {
  contactCount: number;
  onContinue: () => void;
  onInstructions: () => void;
}

export default function OnboardingScreen({
  contactCount,
  onContinue,
  onInstructions,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Become a Super-Connector</Text>
        <Text style={styles.subtitle}>Add 30 contacts in 30 days</Text>
        <SuperConnectorGauge contactCount={contactCount} />
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          accessibilityLabel="Continue to contacts"
          testID="onboarding-continue"
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onInstructions}
          accessibilityLabel="View instructions"
          testID="onboarding-instructions"
        >
          <Text style={styles.instructionsText}>Instructions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.headline.medium,
    color: colors.semantic.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body.large,
    color: colors.semantic.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.huge,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  continueButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.huge,
    borderRadius: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  continueText: {
    ...typography.label.large,
    color: colors.neutral.bone[50],
  },
  instructionsText: {
    ...typography.body.medium,
    color: colors.primary[500],
  },
});
