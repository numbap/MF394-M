/**
 * SummaryThumbnail Component
 *
 * Compact thumbnail view of a contact for grid/list display.
 * Shows photo that flips to reveal name with 3D animation.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ViewStyle,
  Animated,
} from 'react-native';
import { colors, spacing, radii, shadows } from '../../theme/theme';

export interface SummaryThumbnailProps {
  id: string;
  name: string;
  photo?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SummaryThumbnail({
  id,
  name,
  photo,
  onPress,
  style,
}: SummaryThumbnailProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    const toValue = isFlipped ? 0 : 1;

    Animated.timing(flipAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setIsFlipped(!isFlipped);
    onPress?.();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, style]}
    >
      {/* Front side - Photo */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ rotateY: frontInterpolate }],
            opacity: frontOpacity,
          },
        ]}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.neutral.iron[100] }]}>
            <Text style={styles.placeholderText}>👤</Text>
          </View>
        )}
      </Animated.View>

      {/* Back side - Name */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          {
            transform: [{ rotateY: backInterpolate }],
            opacity: backOpacity,
          },
        ]}
      >
        <View style={styles.nameContainer}>
          <Text style={styles.nameText} numberOfLines={3}>
            {name}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    aspectRatio: 1,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.semantic.surface,
    backfaceVisibility: 'hidden',
    ...shadows.sm,
  },
  cardBack: {
    backgroundColor: colors.primary[500],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  nameContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
