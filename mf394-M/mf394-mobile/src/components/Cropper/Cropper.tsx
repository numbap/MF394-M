/**
 * Cropper Component - Hybrid Implementation
 *
 * Web: Uses react-easy-crop for polished UX with real-time preview
 * Mobile: Custom implementation with zoom/pan controls
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewStyle,
  Platform,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';

export interface CropperProps {
  imageUri: string;
  onCropConfirm: (croppedImageUri: string) => void;
  onCancel: () => void;
  style?: ViewStyle;
}

const CANVAS_SIZE = 300;

// Web implementation using react-easy-crop
function WebCropper({ imageUri, onCropConfirm, onCancel }: CropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsLoading(true);

    try {
      const croppedImage = await cropImageUsingCanvas(imageUri, croppedAreaPixels);
      onCropConfirm(croppedImage);
    } catch (error) {
      console.error('Crop failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cropImageUsingCanvas = (
    imageUri: string,
    croppedAreaPixels: any
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        let uriToLoad = imageUri;

        if (imageUri.startsWith('file://')) {
          fetch(imageUri)
            .then((response) => response.blob())
            .then((blob) => {
              const blobUrl = URL.createObjectURL(blob);
              performCanvasCrop(blobUrl, croppedAreaPixels, resolve, reject);
            })
            .catch(reject);
        } else {
          performCanvasCrop(uriToLoad, croppedAreaPixels, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  const performCanvasCrop = (
    imageUri: string,
    croppedAreaPixels: any,
    resolve: (value: string) => void,
    reject: (reason?: any) => void
  ) => {
    const img = new (window as any).Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = Math.round(
          Math.min(croppedAreaPixels.width, croppedAreaPixels.height)
        );
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          size,
          size
        );

        const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);

        if (imageUri.startsWith('blob:')) {
          URL.revokeObjectURL(imageUri);
        }

        resolve(croppedImageUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUri}`));
    };

    img.src = imageUri;
  };

  // Import EasyCrop component for web
  const EasyCrop = require('react-easy-crop').default;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crop Photo</Text>

      {/* Cropper Container */}
      <div style={styles.webCropperContainer}>
        <EasyCrop
          image={imageUri}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={(_croppedArea: any, croppedAreaPixels: any) => {
            setCroppedAreaPixels(croppedAreaPixels);
          }}
          onZoomChange={setZoom}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
            },
          }}
        />
      </div>

      {/* Dimensions Display */}
      <View style={styles.dimensionsContainer}>
        <Text style={styles.dimensionsText}>
          {croppedAreaPixels
            ? `${Math.round(croppedAreaPixels.width)}×${Math.round(
                croppedAreaPixels.height
              )}px`
            : 'Select crop area'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isLoading || !croppedAreaPixels}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Save Crop</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Mobile implementation with custom cropper
function MobileCropper({
  imageUri,
  onCropConfirm,
  onCancel,
  style,
}: CropperProps) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_evt: GestureResponderEvent, gestureState: any) => {
        const newOffsetX = offsetX + gestureState.dx;
        const newOffsetY = offsetY + gestureState.dy;

        const maxOffsetX = (imageDimensions.width * zoom - CANVAS_SIZE) / 2;
        const maxOffsetY = (imageDimensions.height * zoom - CANVAS_SIZE) / 2;

        setOffsetX(Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX)));
        setOffsetY(Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY)));
      },
    })
  ).current;

  const handleImageLoad = (e: any) => {
    setImageDimensions({
      width: e.nativeEvent.source.width,
      height: e.nativeEvent.source.height,
    });
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const croppedUri = await cropImageNative();
      onCropConfirm(croppedUri);
    } catch (error) {
      console.error('Cropping failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cropImageNative = async (): Promise<string> => {
    try {
      const { ImageManipulator } = require('expo-image-manipulator');

      const scaledWidth = imageDimensions.width * zoom;
      const scaledHeight = imageDimensions.height * zoom;

      const sourceX = Math.max(0, (scaledWidth / 2 - CANVAS_SIZE / 2 - offsetX) / zoom);
      const sourceY = Math.max(0, (scaledHeight / 2 - CANVAS_SIZE / 2 - offsetY) / zoom);

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: Math.round(sourceX),
              originY: Math.round(sourceY),
              width: Math.round(CANVAS_SIZE / zoom),
              height: Math.round(CANVAS_SIZE / zoom),
            },
          },
        ],
        { compress: 0.9, format: 'jpeg' }
      );

      return result.uri;
    } catch (error) {
      console.error('Native crop failed:', error);
      throw error;
    }
  };

  const croppedDimensions = Math.round(CANVAS_SIZE);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Crop Photo</Text>

      {/* Canvas Area */}
      <View style={styles.canvasWrapper}>
        <View style={styles.canvas} {...panResponder.panHandlers}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              {
                width: imageDimensions.width * zoom,
                height: imageDimensions.height * zoom,
                transform: [
                  { translateX: offsetX },
                  { translateY: offsetY },
                ],
              },
            ]}
            resizeMode="contain"
            onLoad={handleImageLoad}
          />

          {/* Fixed 1:1 Crop Frame */}
          <View style={styles.cropFrame} />
        </View>

        {/* Dimensions Display */}
        <View style={styles.dimensionsContainer}>
          <Text style={styles.dimensionsText}>
            {croppedDimensions}×{croppedDimensions}px
          </Text>
        </View>
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControlsContainer}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => handleZoomChange(Math.max(0.5, zoom - 0.2))}
        >
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>

        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderFill,
              {
                width: `${((zoom - 0.5) / 2.5) * 100}%`,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => handleZoomChange(Math.min(3, zoom + 0.2))}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>

        <Text style={styles.zoomValue}>{zoom.toFixed(1)}×</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Save Crop</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Main Cropper component - routes to web or mobile implementation
export function Cropper(props: CropperProps) {
  if (Platform.OS === 'web') {
    return <WebCropper {...props} />;
  } else {
    return <MobileCropper {...props} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  webCropperContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.neutral.iron[900],
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  canvasWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: colors.neutral.iron[900],
    borderRadius: radii.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
  },
  image: {
    position: 'absolute',
  },
  cropFrame: {
    position: 'absolute',
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderWidth: 2,
    borderColor: colors.primary[500],
    pointerEvents: 'none',
  },
  dimensionsContainer: {
    backgroundColor: colors.semantic.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
  dimensionsText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  zoomControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.semantic.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
  zoomValue: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
    minWidth: 40,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.body.large.fontSize,
  },
});
