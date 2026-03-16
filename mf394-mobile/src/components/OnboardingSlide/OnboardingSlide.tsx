/**
 * OnboardingSlide
 *
 * Renders a single onboarding slide with a remote image (top ~55%),
 * header/body text and a CTA button (bottom ~45%).
 * Optionally shows a Skip link in the top-right corner.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { colors, spacing, typography, radii } from '../../theme/theme';

interface Props {
  image: string;
  header: string | null;
  body: string | null;
  buttonText: string;
  showSkip: boolean;
  isLast: boolean;
  transitioning?: boolean;
  onNext: () => void;
  onSkip: () => void;
}

export const OnboardingSlide = ({
  image,
  header,
  body,
  buttonText,
  showSkip,
  transitioning,
  onNext,
  onSkip,
}: Props) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [imageError, setImageError] = useState(false);
  const isImageOnly = !header && !body;

  const imageSize = screenWidth * 0.75;

  return (
    <View style={[styles.container, { height: screenHeight }]}>
      {showSkip && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {isImageOnly ? (
        <View style={styles.imageContainerFull}>
          <View style={styles.imageWrapper}>
            {imageError ? (
              <View style={styles.imagePlaceholder} accessibilityLabel="Slide image unavailable" />
            ) : (
              <Image
                source={{ uri: image }}
                style={styles.image}
                resizeMode="contain"
                onError={() => setImageError(true)}
                accessibilityRole="image"
                testID="onboarding-slide-image"
              />
            )}
          </View>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          <View style={{ width: imageSize, height: imageSize }}>
            {imageError ? (
              <View style={styles.imagePlaceholder} accessibilityLabel="Slide image unavailable" />
            ) : (
              <Image
                source={{ uri: image }}
                style={styles.imageCentered}
                resizeMode="contain"
                onError={() => setImageError(true)}
                accessibilityRole="image"
                testID="onboarding-slide-image"
              />
            )}
          </View>
        </View>
      )}

      <View style={isImageOnly ? styles.contentContainerOverlay : styles.contentContainer}>
        {!isImageOnly && (
          <View style={styles.textGroup}>
            <Text style={styles.header}>{header}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, transitioning && styles.buttonDisabled]}
          onPress={onNext}
          disabled={transitioning}
          accessibilityRole="button"
          accessibilityLabel={buttonText}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    color: colors.semantic.textSecondary,
    fontSize: typography.label.large.fontSize,
    fontWeight: typography.label.large.fontWeight,
    letterSpacing: typography.label.large.letterSpacing,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageContainerFull: {
    flex: 1,
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  imageCentered: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.neutral.iron[200],
    borderRadius: radii.md,
  },
  contentContainer: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
    gap: spacing.lg,
  },
  contentContainerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.huge,
  },
  textGroup: {
    gap: spacing.md,
  },
  header: {
    fontSize: typography.headline.small.fontSize,
    lineHeight: typography.headline.small.lineHeight,
    fontWeight: typography.headline.small.fontWeight,
    color: colors.semantic.text,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.body.large.fontSize,
    lineHeight: typography.body.large.lineHeight,
    fontWeight: typography.body.large.fontWeight,
    color: colors.semantic.textSecondary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.neutral.bone[50],
    fontSize: typography.label.large.fontSize,
    fontWeight: typography.label.large.fontWeight,
    letterSpacing: typography.label.large.letterSpacing,
  },
});
