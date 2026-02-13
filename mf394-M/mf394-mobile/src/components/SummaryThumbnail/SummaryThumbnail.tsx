/**
 * SummaryThumbnail Component
 *
 * Compact thumbnail view of a contact for grid/list display.
 * Shows photo with name overlay on tap.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ViewStyle,
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
  const [showName, setShowName] = useState(false);

  const handlePress = () => {
    setShowName(!showName);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        style,
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

      {showName && (
        <View style={styles.nameOverlay}>
          <Text style={styles.nameText} numberOfLines={2}>
            {name}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    aspectRatio: 1,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.8,
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
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
