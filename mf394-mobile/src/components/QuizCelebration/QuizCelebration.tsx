import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { colors, spacing, radii, typography, shadows } from "../../theme/theme";

const { height: screenHeight } = Dimensions.get("window");

interface QuizCelebrationProps {
  onPlayAgain: () => void;
}

const CONFETTI_COLORS = [
  colors.primary[500],
  colors.secondary[500],
  colors.accent[500],
  colors.purple[400],
  colors.semantic.success,
];

// Particle config computed once at module level (stable across renders)
const PARTICLE_CONFIGS = Array.from({ length: 24 }, (_, i) => ({
  left: (i / 24) * 100 + Math.sin(i * 1.3) * 4,
  size: 8 + (i % 8),
  delay: Math.floor((i / 24) * 1200),
  duration: 2000 + (i % 6) * 250,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

interface ConfettiParticleProps {
  left: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

function ConfettiParticle({ left, size, delay, duration, color }: ConfettiParticleProps) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = -20;
    opacity.value = 1;
    translateY.value = withDelay(delay, withTiming(screenHeight + 20, { duration }));
    opacity.value = withDelay(delay + duration * 0.7, withTiming(0, { duration: duration * 0.3 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${left}%` as any,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export function QuizCelebration({ onPlayAgain }: QuizCelebrationProps) {
  return (
    <View style={styles.container}>
      {PARTICLE_CONFIGS.map((config, i) => (
        <ConfettiParticle
          key={i}
          left={config.left}
          size={config.size}
          delay={config.delay}
          duration={config.duration}
          color={config.color}
        />
      ))}

      <View style={styles.card}>
        <Text style={styles.headline}>Great job!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={onPlayAgain}
          accessibilityLabel="Play again"
          testID="play-again-button"
        >
          <FontAwesome name="refresh" size={24} color={colors.neutral.bone[50]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    top: 0,
  },
  card: {
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.xl,
    padding: spacing.xxxl,
    alignItems: "center",
    width: "80%",
    ...shadows.xl,
  },
  headline: {
    ...typography.headline.medium,
    color: colors.semantic.text,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary[500],
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
