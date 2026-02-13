/**
 * Face Selector Component
 *
 * Displays detected faces in a grid for user to select.
 * Used after face detection to let user choose which face to use.
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
}

export function FaceSelector({
  faces,
  onSelectFace,
  onCropInstead,
  style,
}: FaceSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleSelectFace = (index: number) => {
    setSelectedIndex(index);
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
            style={[
              styles.faceButton,
              selectedIndex === index && styles.faceButtonSelected,
            ]}
            onPress={() => handleSelectFace(index)}
          >
            <Image
              source={{ uri: face.uri }}
              style={styles.faceImage}
              resizeMode="cover"
            />

            {/* Confidence badge */}
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(face.confidence * 100)}%
              </Text>
            </View>

            {/* Selection indicator */}
            {selectedIndex === index && (
              <View style={styles.selectedOverlay}>
                <FontAwesome name="check-circle" size={32} color="#fff" />
              </View>
            )}
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
          >
            <FontAwesome name="crop" size={16} color={colors.primary[500]} />
            <Text style={styles.alternativeButtonText}>Crop Manually</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Action button */}
      <TouchableOpacity style={styles.confirmButton}>
        <FontAwesome name="check" size={18} color="#fff" />
        <Text style={styles.confirmButtonText}>Use Face #{selectedIndex + 1}</Text>
      </TouchableOpacity>
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
  faceButtonSelected: {
    borderColor: colors.primary[500],
    borderWidth: 4,
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  confidenceText: {
    fontSize: typography.body.small.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
  selectedOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(84, 127, 171, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.accent[500],
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
  },
  confirmButtonText: {
    fontSize: typography.body.large.fontSize,
    fontWeight: '700',
    color: '#fff',
  },
});
