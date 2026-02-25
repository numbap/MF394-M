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

import React, { useState, useRef, useEffect } from "react";
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
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { FormButtons } from "../FormButtons";
import { colors, spacing, radii, typography, shadows } from "../../theme/theme";

export interface CropperProps {
  imageUri: string;
  onCropConfirm: (croppedImageUri: string) => void;
  onCancel: () => void;
  style?: ViewStyle;
}

const DEVICE_WIDTH = Dimensions.get("window").width;
const CANVAS_SIZE = DEVICE_WIDTH - spacing.lg * 2; // Device width minus padding (used by mobile only)

// Clean Slider Component
interface SliderComponentProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  step: number;
  containerWidth: number;
}

function SliderComponent({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  step,
  containerWidth,
}: SliderComponentProps) {
  const sliderWidth = containerWidth - spacing.md * 2;
  const sliderRef = useRef<View>(null);
  const sliderXRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Get touch position relative to slider
        if (sliderRef.current) {
          sliderRef.current.measure((_x, _y, _width, _height, pageX) => {
            sliderXRef.current = pageX;
            updateValueFromTouch(evt.nativeEvent.pageX, pageX);
          });
        }
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        updateValueFromTouch(evt.nativeEvent.pageX, sliderXRef.current);
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

  // Responsive canvas sizing for web
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();

  // UI chrome height (measured from actual components)
  const UI_CHROME_HEIGHT =
    spacing.lg + // top padding
    typography.headline.large.lineHeight +
    spacing.lg + // title + margin
    spacing.lg + // margin below canvas
    76 + // slider container (padding + thumb + margin)
    148; // form buttons (marginTop + buttons + gaps)

  const availableWidth = viewportWidth - spacing.lg * 2;
  const availableHeight = viewportHeight - UI_CHROME_HEIGHT;
  const calculatedSize = Math.min(availableWidth, availableHeight);
  const CANVAS_SIZE = Math.max(300, calculatedSize);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsLoading(true);

    try {
      const croppedImage = await cropImageUsingCanvas(imageUri, croppedAreaPixels);
      onCropConfirm(croppedImage);
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cropImageUsingCanvas = (imageUri: string, croppedAreaPixels: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        let uriToLoad = imageUri;

        if (imageUri.startsWith("file://")) {
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
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = Math.round(Math.min(croppedAreaPixels.width, croppedAreaPixels.height));
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get canvas context");
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

        const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);

        if (imageUri.startsWith("blob:")) {
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
  const EasyCrop = require("react-easy-crop").default;

  return (
    <View style={[styles.container, { width: viewportWidth, alignItems: "center" }]}>
      {/* Cropper Container */}
      <div
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          backgroundColor: colors.neutral.iron[900],
          borderRadius: radii.lg,
          overflow: "hidden",
          marginBottom: spacing.lg,
          position: "relative",
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
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
            },
          }}
        />
      </div>

      {/* Zoom Slider */}
      <View style={[styles.sliderContainer, { width: CANVAS_SIZE + spacing.lg * 2 }]}>
        <SliderComponent
          value={zoom}
          onValueChange={setZoom}
          minimumValue={0.25}
          maximumValue={5}
          step={0.05}
          containerWidth={CANVAS_SIZE + spacing.lg * 2}
        />
      </View>

      {/* Action Buttons */}
      <FormButtons
        primaryButton={{
          label: "Crop",
          icon: "crop",
          onPress: handleConfirm,
          isLoading: isLoading,
        }}
        cancelButton={{
          label: "Cancel",
          icon: "times",
          onPress: onCancel,
        }}
      />
    </View>
  );
}

// Mobile implementation with custom cropper
function MobileCropper({ imageUri, onCropConfirm, onCancel, style }: CropperProps) {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Track pinch gesture state
  const initialDistance = useRef<number | null>(null);
  const initialZoom = useRef<number>(zoom);

  // Refs to track current offsets (avoids stale closures in PanResponder)
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const panStartX = useRef(0);
  const panStartY = useRef(0);

  // Refs to mirror state for use inside PanResponder (avoids stale closures)
  const imageDimensionsRef = useRef({ width: 0, height: 0 });
  const zoomRef = useRef(1);
  // minZoomRef needed because PanResponder callbacks close over the initial value
  const minZoomRef = useRef(0.1);

  // Use a no-op manipulateAsync call to get post-EXIF dimensions.
  // Image.getSize on Android returns raw file dimensions ignoring EXIF rotation
  // (e.g. 4000x3000 for a portrait photo stored landscape with EXIF rotation=90),
  // but manipulateAsync applies EXIF — giving us the true oriented size that
  // matches what the <Image> component displays and what crop operations use.
  useEffect(() => {
    let cancelled = false;
    const { manipulateAsync } = require("expo-image-manipulator");
    manipulateAsync(imageUri, []).then((probe: { width: number; height: number }) => {
      if (cancelled) return;
      const w = probe.width;
      const h = probe.height;
      console.log(`[MobileCropper] manipulateAsync probe: w=${w} h=${h} CANVAS_SIZE=${CANVAS_SIZE}`);
      setImageDimensions({ width: w, height: h });
      imageDimensionsRef.current = { width: w, height: h };
      // Minimum zoom that fits the entire image inside the canvas square.
      const fitZoom = Math.min(CANVAS_SIZE / w, CANVAS_SIZE / h);
      setMinZoom(fitZoom);
      minZoomRef.current = fitZoom;
      setZoom(fitZoom);
      zoomRef.current = fitZoom;
    }).catch((err: any) => {
      if (!cancelled) console.warn('MobileCropper: failed to probe image size', err);
    });
    return () => { cancelled = true; };
  }, [imageUri]);

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
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        // Check for pinch gesture (2 touches)
        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = getDistance(evt.nativeEvent.touches);
          initialZoom.current = zoomRef.current;
        } else {
          // Capture offset at gesture start to avoid stale closure jump
          panStartX.current = offsetXRef.current;
          panStartY.current = offsetYRef.current;
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
            const clampedZoom = Math.max(minZoomRef.current, Math.min(3, newZoom));
            setZoom(clampedZoom);
            zoomRef.current = clampedZoom;
          }
        } else {
          // Pan gesture (1 touch) — use refs to avoid stale closure
          const newOffsetX = panStartX.current + gestureState.dx;
          const newOffsetY = panStartY.current + gestureState.dy;

          const maxOffsetX = (imageDimensionsRef.current.width * zoomRef.current - CANVAS_SIZE) / 2;
          const maxOffsetY = (imageDimensionsRef.current.height * zoomRef.current - CANVAS_SIZE) / 2;

          // If image is smaller than canvas on an axis, lock that axis to center (0)
          const clampedX = maxOffsetX > 0 ? Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX)) : 0;
          const clampedY = maxOffsetY > 0 ? Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY)) : 0;

          setOffsetX(clampedX);
          offsetXRef.current = clampedX;
          setOffsetY(clampedY);
          offsetYRef.current = clampedY;
        }
      },
      onPanResponderRelease: () => {
        // Reset pinch tracking
        initialDistance.current = null;
      },
    })
  ).current;

  const handleImageLoad = (_e: any) => {
    // Dimensions and zoom are set exclusively by Image.getSize in the useEffect.
    // We do NOT read e.nativeEvent.source here because on Android the dimensions
    // it reports can differ from the source-pixel dimensions (e.g. different
    // scale than Image.getSize, or pre-/post-EXIF-rotation) which would corrupt
    // the crop math. Only reset pan offsets when the image finishes loading.
    setOffsetX(0);
    offsetXRef.current = 0;
    setOffsetY(0);
    offsetYRef.current = 0;
  };

  const handleZoomChange = (value: number) => {
    setZoom(value);
    zoomRef.current = value;
    setOffsetX(0);
    offsetXRef.current = 0;
    setOffsetY(0);
    offsetYRef.current = 0;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const croppedUri = await cropImageNative();
      onCropConfirm(croppedUri);
    } catch (error) {
      console.error("Cropping failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const cropImageNative = async (): Promise<string> => {
    try {
      const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");

      // Use refs, not state — state can be stale inside an async callback.
      const { width: imgW, height: imgH } = imageDimensionsRef.current;
      const z = zoomRef.current;
      const ox = offsetXRef.current;
      const oy = offsetYRef.current;

      console.log(`[MobileCropper] cropImageNative: imgW=${imgW} imgH=${imgH} zoom=${z.toFixed(4)} ox=${ox.toFixed(1)} oy=${oy.toFixed(1)} CANVAS_SIZE=${CANVAS_SIZE}`);

      const scaledWidth = imgW * z;
      const scaledHeight = imgH * z;

      // Raw crop origin in source-image coordinates
      const rawOriginX = (scaledWidth / 2 - CANVAS_SIZE / 2 - ox) / z;
      const rawOriginY = (scaledHeight / 2 - CANVAS_SIZE / 2 - oy) / z;

      // Clamp origin so it stays inside the image
      const originX = Math.max(0, Math.min(Math.round(rawOriginX), imgW - 1));
      const originY = Math.max(0, Math.min(Math.round(rawOriginY), imgH - 1));

      // Clamp size so origin + size never exceeds the image boundary.
      // Without this, zooming out to "fit" level produces CANVAS_SIZE/zoom > imageDimension
      // which throws "Invalid crop operation" from expo-image-manipulator.
      const rawSize = CANVAS_SIZE / z;
      const cropWidth = Math.min(Math.round(rawSize), imgW - originX);
      const cropHeight = Math.min(Math.round(rawSize), imgH - originY);

      // Image.getSize returns actual file pixel dimensions. expo-image-manipulator uses
      // the same file pixel coordinate space. No PixelRatio conversion is needed here.
      console.log(`[MobileCropper] crop region: originX=${originX} originY=${originY} w=${cropWidth} h=${cropHeight} (file=${imgW}x${imgH})`);

      const result = await manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width: Math.max(1, cropWidth),
              height: Math.max(1, cropHeight),
            },
          },
        ],
        { compress: 0.9, format: SaveFormat.JPEG, base64: true }
      );

      console.log(`[MobileCropper] result: ${result.width}x${result.height}`);
      return `data:image/jpeg;base64,${result.base64}`;
    } catch (error) {
      console.error("Native crop failed:", error);
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
                left: (CANVAS_SIZE - imageDimensions.width * zoom) / 2,
                top: (CANVAS_SIZE - imageDimensions.height * zoom) / 2,
                transform: [{ translateX: offsetX }, { translateY: offsetY }],
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
          minimumValue={minZoom}
          maximumValue={3}
          step={0.05}
          containerWidth={DEVICE_WIDTH - spacing.lg * 2}
        />
      </View>

      {/* Action Buttons */}
      <FormButtons
        primaryButton={{
          label: "Crop",
          icon: "crop",
          onPress: handleConfirm,
          isLoading: isLoading,
        }}
        cancelButton={{
          label: "Cancel",
          icon: "times",
          onPress: onCancel,
        }}
      />
    </View>
  );
}

// Main Cropper component - routes to web or mobile implementation
export function Cropper(props: CropperProps) {
  if (Platform.OS === "web") {
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
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  canvasWrapper: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  canvas: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: colors.neutral.iron[900],
    borderRadius: radii.lg,
    overflow: "hidden",
    position: "relative",
    ...shadows.md,
  },
  image: {
    position: "absolute",
  },
  cropFrame: {
    position: "absolute",
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    borderWidth: 2,
    borderColor: colors.primary[500],
    pointerEvents: "none",
  },
  sliderContainer: {
    width: "100%",
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
    justifyContent: "center",
    position: "relative",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: radii.full,
  },
  sliderThumb: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary[500],
    marginLeft: -14,
    top: -10,
    ...shadows.md,
  },
});
