/**
 * Cropper Component - Hybrid Implementation
 *
 * Web: Uses react-easy-crop for polished UX with real-time preview
 * Mobile: Custom implementation with zoom/pan controls
 *
 * Layout:
 * - Takes device width with 1:1 aspect ratio (square)
 * - Slider below for zoom control (clean, no labels)
 * - Save/Cancel buttons at bottom
 * - Returns base64 string for cropped image
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ViewStyle,
  Platform,
  PanResponder,
  GestureResponderEvent,
  Dimensions,
} from 'react-native';
import { FormButtons } from '../FormButtons';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';

export interface CropperProps {
  imageUri: string;
  onCropConfirm: (croppedImageUri: string) => void;
  onCancel: () => void;
  style?: ViewStyle;
}

const DEVICE_WIDTH = Dimensions.get('window').width;
const CANVAS_SIZE = DEVICE_WIDTH - spacing.lg * 2; // Device width minus padding

// Clean Slider Component
interface SliderComponentProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
}

function SliderComponent({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
}: SliderComponentProps) {
  const sliderWidth = DEVICE_WIDTH - spacing.lg * 2 - spacing.md * 2;
  const sliderRef = useRef<View>(null);
  const [sliderX, setSliderX] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Get touch position relative to slider
        if (sliderRef.current) {
          sliderRef.current.measure((_x, _y, _width, _height, pageX) => {
            setSliderX(pageX);
            updateValueFromTouch(evt.nativeEvent.pageX, pageX);
          });
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        updateValueFromTouch(evt.nativeEvent.pageX, sliderX);
      },
    })
  ).current;

  const updateValueFromTouch = (touchX: number, trackX: number) => {
    const position = touchX - trackX;
    const clampedPosition = Math.max(0, Math.min(sliderWidth, position));
    const percentage = clampedPosition / sliderWidth;
    const totalRange = maximumValue - minimumValue;
    const rawValue = minimumValue + percentage * totalRange;
    const snappedValue = Math.round(rawValue / step) * step;
    onValueChange(Math.max(minimumValue, Math.min(maximumValue, snappedValue)));
  };

  const progress = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = progress * sliderWidth;

  return (
    <View style={styles.sliderWrapper} {...panResponder.panHandlers}>
      <View ref={sliderRef} style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: thumbPosition }]} />
        <View
          style={[
            styles.sliderThumb,
            {
              left: thumbPosition,
            },
          ]}
        />
      </View>
    </View>
  );
}

// Web implementation using react-easy-crop
function WebCropper({ imageUri, onCropConfirm, onCancel }: CropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(2); // Default 200%
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
      <div
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          backgroundColor: colors.neutral.iron[900],
          borderRadius: radii.lg,
          overflow: 'hidden',
          marginBottom: spacing.lg,
          position: 'relative',
        }}
      >
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

      {/* Zoom Slider */}
      <View style={styles.sliderContainer}>
        <SliderComponent
          value={zoom}
          onValueChange={setZoom}
          minimumValue={0.5}
          maximumValue={3}
          step={0.05}
        />
      </View>

      {/* Action Buttons */}
      <FormButtons
        primaryButton={{
          label: 'Crop',
          icon: 'crop',
          onPress: handleConfirm,
          isLoading: isLoading,
        }}
        cancelButton={{
          label: 'Cancel',
          icon: 'times',
          onPress: onCancel,
        }}
      />
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
  const [zoom, setZoom] = useState(2); // Default 200%
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Track pinch gesture state
  const initialDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(zoom);

  // Calculate distance between two touch points
  const getDistance = (touches: any[]) => {
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Check for pinch gesture (2 touches)
        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = getDistance(evt.nativeEvent.touches);
          initialZoom.current = zoom;
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent, gestureState: any) => {
        // Pinch to zoom (2 touches)
        if (evt.nativeEvent.touches.length === 2) {
          const currentDistance = getDistance(evt.nativeEvent.touches);
          if (initialDistance.current) {
            const scale = currentDistance / initialDistance.current;
            const newZoom = initialZoom.current * scale;
            // Clamp zoom to valid range
            const clampedZoom = Math.max(0.5, Math.min(3, newZoom));
            setZoom(clampedZoom);
          }
        } else {
          // Pan gesture (1 touch)
          const newOffsetX = offsetX + gestureState.dx;
          const newOffsetY = offsetY + gestureState.dy;

          const maxOffsetX = (imageDimensions.width * zoom - CANVAS_SIZE) / 2;
          const maxOffsetY = (imageDimensions.height * zoom - CANVAS_SIZE) / 2;

          setOffsetX(Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX)));
          setOffsetY(Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY)));
        }
      },
      onPanResponderRelease: () => {
        // Reset pinch tracking
        initialDistance.current = null;
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

      // Convert to base64
      const fs = require('expo-file-system');
      const base64 = await fs.readAsStringAsync(result.uri, {
        encoding: fs.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Native crop failed:', error);
      throw error;
    }
  };

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
      </View>

      {/* Zoom Slider - Clean Interface */}
      <View style={styles.sliderContainer}>
        <SliderComponent
          value={zoom}
          onValueChange={handleZoomChange}
          minimumValue={0.5}
          maximumValue={3}
          step={0.05}
        />
      </View>

      {/* Action Buttons */}
      <FormButtons
        primaryButton={{
          label: 'Crop',
          icon: 'crop',
          onPress: handleConfirm,
          isLoading: isLoading,
        }}
        cancelButton={{
          label: 'Cancel',
          icon: 'times',
          onPress: onCancel,
        }}
      />
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
    backgroundColor: colors.semantic.background,
    padding: spacing.lg,
    width: DEVICE_WIDTH,
  },
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  canvasWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  sliderContainer: {
    width: '100%',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sliderWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: colors.semantic.border,
    borderRadius: radii.full,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: radii.full,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary[500],
    marginLeft: -14,
    top: -10,
    ...shadows.md,
  },
});
