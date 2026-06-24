import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/theme';

export interface CountdownTimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.unit}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function CountdownTimer({
  days,
  hours,
  minutes,
  seconds,
}: CountdownTimerProps) {
  return (
    <View style={styles.container} testID="countdown-timer">
      <TimeUnit value={pad(days)} label="days" />
      <Text style={styles.separator}>:</Text>
      <TimeUnit value={pad(hours)} label="hrs" />
      <Text style={styles.separator}>:</Text>
      <TimeUnit value={pad(minutes)} label="min" />
      <Text style={styles.separator}>:</Text>
      <TimeUnit value={pad(seconds)} label="sec" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  unit: {
    alignItems: 'center',
    minWidth: 40,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.semantic.text,
    fontVariant: ['tabular-nums'],
  },
  label: {
    ...typography.body.small,
    color: colors.semantic.textSecondary,
  },
  separator: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.semantic.textTertiary,
    marginBottom: spacing.lg,
  },
});
