/**
 * OnboardingScreen
 *
 * Full-screen onboarding flow (iOS/Android only).
 * Composes OnboardingSlide and OnboardingDots.
 * Skipping requires confirmation; completion calls the onComplete callback.
 */

import React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../../components/OnboardingSlide';
import { OnboardingDots } from '../../components/OnboardingDots';
import { useOnboarding } from '../../hooks/useOnboarding';
import { colors, spacing } from '../../theme/theme';

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { screens, currentIndex, isLastSlide, transitioning, goNext } = useOnboarding();

  const handleSkip = () => {
    Alert.alert(
      'Skip tutorial?',
      "You won't be able to come back to this tutorial later.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, skip', style: 'destructive', onPress: onComplete },
      ]
    );
  };

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      goNext();
    }
  };

  if (screens.length === 0) {
    return <View style={styles.blank} />;
  }

  const slide = screens[currentIndex];

  return (
    <View style={styles.container}>
      <OnboardingSlide
        image={slide.image}
        header={slide.header}
        body={slide.body}
        buttonText={slide.buttonText}
        showSkip={slide.showSkip}
        isLast={isLastSlide}
        transitioning={transitioning}
        onNext={handleNext}
        onSkip={handleSkip}
      />
      <View style={styles.dotsContainer}>
        <OnboardingDots total={screens.length} current={currentIndex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  blank: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
});
