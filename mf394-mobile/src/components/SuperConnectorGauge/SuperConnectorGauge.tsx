import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolateColor,
  useDerivedValue,
} from "react-native-reanimated";
import { colors, spacing, typography } from "../../theme/theme";
import { ConfettiOverlay } from "./ConfettiOverlay";
import { SUPER_CONNECTOR_MAX } from "../../constants";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RING_SIZE = 180;
const STROKE_WIDTH = 20;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getMotivationalText(count: number, max: number): string {
  if (count >= max) return "Super-Connector!";
  if (count >= max * 0.67) return "Almost there!";
  if (count >= max * 0.33) return "You're building momentum!";
  if (count >= 1) return "Keep going!";
  return "Add your first contact!";
}

export interface SuperConnectorGaugeProps {
  contactCount: number;
  maxCount?: number;
}

export function SuperConnectorGauge({ contactCount, maxCount = SUPER_CONNECTOR_MAX }: SuperConnectorGaugeProps) {
  const clamped = Math.min(Math.max(contactCount, 0), maxCount);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const isCelebrating = clamped >= maxCount;

  useEffect(() => {
    progress.value = withTiming(clamped / maxCount, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    if (isCelebrating) {
      scale.value = withDelay(
        400,
        withSequence(withTiming(1.05, { duration: 300 }), withTiming(1, { duration: 300 }))
      );
    }
  }, [clamped, maxCount, isCelebrating]);

  const colorValue = useDerivedValue(() => {
    return interpolateColor(
      progress.value,
      [0, 0.33, 0.5, 0.83, 1],
      ["#dc2626", "#f97316", "#eab308", "#84cc16", "#22c55e"]
    );
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
      stroke: colorValue.value,
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const motivationalText = getMotivationalText(clamped, maxCount);

  return (
    <View style={styles.container} testID="super-connector-gauge">
      {isCelebrating && <ConfettiOverlay />}
      <Animated.View style={pulseStyle}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.neutral.iron[100]}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            animatedProps={animatedProps}
          />
        </Svg>
        <View style={styles.centerContent}>
          <Text style={styles.countText}>{clamped}</Text>
          <Text style={styles.ofText}>of {maxCount}</Text>
        </View>
      </Animated.View>
      <Text style={styles.motivationalText}>{motivationalText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  centerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.semantic.text,
  },
  ofText: {
    ...typography.body.medium,
    color: colors.semantic.textSecondary,
  },
  motivationalText: {
    ...typography.label.large,
    color: colors.semantic.textSecondary,
    marginTop: spacing.sm,
  },
});
