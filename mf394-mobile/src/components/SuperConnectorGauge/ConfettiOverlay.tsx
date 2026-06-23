import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../theme/theme';

const CONFETTI_COLORS = [
  colors.primary[500],
  colors.secondary[500],
  colors.accent[500],
  colors.purple[400],
  colors.semantic.success,
];

const PARTICLE_CONFIGS = Array.from({ length: 16 }, (_, i) => ({
  left: (i / 16) * 100 + Math.sin(i * 1.3) * 4,
  size: 6 + (i % 6),
  delay: Math.floor((i / 16) * 800),
  duration: 1500 + (i % 4) * 200,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

function ConfettiParticle({
  left,
  size,
  delay,
  duration,
  color,
  fallDistance,
}: {
  left: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  fallDistance: number;
}) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(fallDistance, { duration }));
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }),
    );
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
          left: `${left}%` as unknown as number,
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

export function ConfettiOverlay() {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={styles.layer} pointerEvents="none">
      {PARTICLE_CONFIGS.map((config, i) => (
        <ConfettiParticle
          key={i}
          left={config.left}
          size={config.size}
          delay={config.delay}
          duration={config.duration}
          color={config.color}
          fallDistance={screenHeight * 0.4}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
  },
});
