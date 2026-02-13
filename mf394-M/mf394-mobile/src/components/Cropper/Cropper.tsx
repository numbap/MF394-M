/**
 * Cropper Component
 *
 * Interactive image cropper with pan/zoom and manual crop region adjustment.
 * Allows users to crop face photos to desired region.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropperProps {
  imageUri: string;
  onCropConfirm: (cropRegion: CropRegion) => void;
  onCancel: () => void;
  initialCrop?: CropRegion;
  aspectRatio?: number;
  style?: ViewStyle;
}

const DEFAULT_CROP_SIZE = 300; // pixels

export function Cropper({
  imageUri,
  onCropConfirm,
  onCancel,
  initialCrop,
  aspectRatio = 1,
  style,
}: CropperProps) {
  const [cropRegion, setCropRegion] = useState<CropRegion>(
    initialCrop || {
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    }
  );

  const handleZoomIn = () => {
    setCropRegion({
      ...cropRegion,
      width: Math.min(cropRegion.width + 5, 100),
      height: Math.min(cropRegion.height + 5, 100),
    });
  };

  const handleZoomOut = () => {
    setCropRegion({
      ...cropRegion,
      width: Math.max(cropRegion.width - 5, 20),
      height: Math.max(cropRegion.height - 5, 20),
    });
  };

  const handleReset = () => {
    setCropRegion({
      x: 25,
      y: 25,
      width: 50,
      height: 50,
    });
  };

  const handleConfirm = () => {
    onCropConfirm(cropRegion);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Image Preview with Crop Overlay */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />

        {/* Crop Region Overlay */}
        <View
          style={[
            styles.cropRegion,
            {
              left: `${cropRegion.x}%`,
              top: `${cropRegion.y}%`,
              width: `${cropRegion.width}%`,
              height: `${cropRegion.height}%`,
            },
          ]}
        >
          {/* Corner handles */}
          <View style={styles.cornerHandle} />
          <View style={[styles.cornerHandle, styles.cornerHandleTopRight]} />
          <View style={[styles.cornerHandle, styles.cornerHandleBottomLeft]} />
          <View style={[styles.cornerHandle, styles.cornerHandleBottomRight]} />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
          <Text style={styles.controlIcon}>➖</Text>
          <Text style={styles.controlLabel}>Zoom Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
          <Text style={styles.controlIcon}>➕</Text>
          <Text style={styles.controlLabel}>Zoom In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
          <Text style={styles.controlIcon}>↻</Text>
          <Text style={styles.controlLabel}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>Confirm Crop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
    gap: spacing.lg,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.neutral.iron[900],
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cropRegion: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.primary[500],
    backgroundColor: 'rgba(84, 127, 171, 0.1)',
  },
  cornerHandle: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: colors.primary[500],
    borderRadius: radii.full,
    top: -8,
    left: -8,
  },
  cornerHandleTopRight: {
    top: -8,
    left: 'auto',
    right: -8,
  },
  cornerHandleBottomLeft: {
    top: 'auto',
    bottom: -8,
    left: -8,
  },
  cornerHandleBottomRight: {
    top: 'auto',
    bottom: -8,
    left: 'auto',
    right: -8,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  controlButton: {
    flex: 1,
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  controlIcon: {
    fontSize: 18,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.semantic.text,
    fontWeight: '600',
    fontSize: typography.body.large.fontSize,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.body.large.fontSize,
  },
});
