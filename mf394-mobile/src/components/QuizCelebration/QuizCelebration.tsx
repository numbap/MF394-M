import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { colors, spacing, radii, typography, shadows } from "../../theme/theme";

const { height: screenHeight } = Dimensions.get("window");

interface QuizCelebrationProps {
  visible: boolean;
  score: number;
  total: number;
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
  trigger: boolean;
}

function ConfettiParticle({ left, size, delay, duration, color, trigger }: ConfettiParticleProps) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (trigger) {
      translateY.value = -20;
      opacity.value = 1;
      translateY.value = withDelay(delay, withTiming(screenHeight + 20, { duration }));
      opacity.value = withDelay(delay + duration * 0.7, withTiming(0, { duration: duration * 0.3 }));
    } else {
      translateY.value = -20;
      opacity.value = 1;
    }
  }, [trigger]);

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

export function QuizCelebration({ visible, score, total, onPlayAgain }: QuizCelebrationProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {PARTICLE_CONFIGS.map((config, i) => (
          <ConfettiParticle
            key={i}
            left={config.left}
            size={config.size}
            delay={config.delay}
            duration={config.duration}
            color={config.color}
            trigger={visible}
          />
        ))}

        <View style={styles.card}>
          <Text style={styles.headline}>Great job!</Text>
          <Text style={styles.body}>
            You got {score} out of {total} right!
          </Text>
          <TouchableOpacity style={styles.button} onPress={onPlayAgain}>
            <Text style={styles.buttonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: spacing.md,
    textAlign: "center",
  },
  body: {
    ...typography.body.large,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  buttonText: {
    ...typography.title.small,
    color: colors.neutral.bone[50],
  },
});
