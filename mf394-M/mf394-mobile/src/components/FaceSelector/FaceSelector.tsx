/**
 * Face Selector Component
 *
 * Displays detected faces in a grid for user to select.
 * Used after face detection to let user choose which face to use.
 * 
 * Notes
 * The face detection logic should select all of the faces in an image, crop them around each face, and then return all of the headshots as a series of images cropped arond the faces. 
 * Then the user simply presses on the image they want to chose. 
 * There is no default face selected, or a Use Face button. The images act as buttons. 
 * No need for percentage match scores. Just crop closely around individual faces. 
 * 
 * When an image is uploaded, the alogorithm should analyze the image and crop out all of the faces it detects, and then return those cropped images to the user to select from.
 * 
 * When the user clicks on a cropped face, it shold return the based64 string of the cropped image to the main form of the Add or Edit flow to be used as the thumbnail. 
 * If no face is detected, redirect to the cropper so that the user can select their the face themselves. 
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface Face {
  id: string;
  uri: string;
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  confidence: number;
}

interface FaceSelectorProps {
  faces: Face[];
  onSelectFace: (faceIndex: number) => void;
  onCropInstead?: () => void;
  style?: ViewStyle;
  isLoading?: boolean;
}

export function FaceSelector({
  faces,
  onSelectFace,
  onCropInstead,
  style,
  isLoading = false,
}: FaceSelectorProps) {
  const handleSelectFace = (index: number) => {
    onSelectFace(index);
  };

  return (
    <ScrollView style={[styles.container, style]}>
      <Text style={styles.title}>Select a Face</Text>
      <Text style={styles.subtitle}>
        Found {faces.length} face{faces.length !== 1 ? 's' : ''}. Tap to select one.
      </Text>

      {/* Face Grid */}
      <View style={styles.grid}>
        {faces.map((face, index) => (
          <TouchableOpacity
            key={face.id}
            style={styles.faceButton}
            onPress={() => handleSelectFace(index)}
            disabled={isLoading}
            activeOpacity={isLoading ? 1 : 0.7}
          >
            <Image
              source={{ uri: face.uri }}
              style={styles.faceImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Or crop manually option */}
      {onCropInstead && (
        <View style={styles.alternativeContainer}>
          <Text style={styles.alternativeText}>
            Not happy with these faces?
          </Text>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={onCropInstead}
            disabled={isLoading}
          >
            <FontAwesome name="crop" size={16} color={colors.primary[500]} />
            <Text style={styles.alternativeButtonText}>Crop Manually</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.semantic.background,
  },
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  faceButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.semantic.border,
    backgroundColor: colors.semantic.surface,
    position: 'relative',
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
  alternativeContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
  },
  alternativeText: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
  },
  alternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[500],
    borderRadius: radii.md,
  },
  alternativeButtonText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.primary[500],
  },
});
