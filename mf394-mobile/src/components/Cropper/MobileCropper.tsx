import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  PanResponder,
  GestureResponderEvent,
  useWindowDimensions,
} from "react-native";
import { FormButtons } from "../FormButtons";
import { CropperSlider } from "./CropperSlider";
import { colors, spacing, radii, shadows } from "../../theme/theme";
import type { CropperProps } from "./Cropper";

export function MobileCropper({ imageUri, onCropConfirm, onCancel, style }: CropperProps) {
  const { width: deviceWidth } = useWindowDimensions();
  const canvasSize = deviceWidth - spacing.lg * 2;

  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Keep canvasSize in a ref so PanResponder callbacks avoid stale closures
  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;

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
      setImageDimensions({ width: w, height: h });
      imageDimensionsRef.current = { width: w, height: h };
      // Minimum zoom that fits the entire image inside the canvas square.
      const fitZoom = Math.min(canvasSizeRef.current / w, canvasSizeRef.current / h);
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

          const maxOffsetX = (imageDimensionsRef.current.width * zoomRef.current - canvasSizeRef.current) / 2;
          const maxOffsetY = (imageDimensionsRef.current.height * zoomRef.current - canvasSizeRef.current) / 2;

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

      const scaledWidth = imgW * z;
      const scaledHeight = imgH * z;

      const cs = canvasSizeRef.current;
      // Raw crop origin in source-image coordinates
      const rawOriginX = (scaledWidth / 2 - cs / 2 - ox) / z;
      const rawOriginY = (scaledHeight / 2 - cs / 2 - oy) / z;

      // Clamp origin so it stays inside the image
      const originX = Math.max(0, Math.min(Math.round(rawOriginX), imgW - 1));
      const originY = Math.max(0, Math.min(Math.round(rawOriginY), imgH - 1));

      // Clamp size so origin + size never exceeds the image boundary.
      // Without this, zooming out to "fit" level produces CANVAS_SIZE/zoom > imageDimension
      // which throws "Invalid crop operation" from expo-image-manipulator.
      const rawSize = cs / z;
      const cropWidth = Math.min(Math.round(rawSize), imgW - originX);
      const cropHeight = Math.min(Math.round(rawSize), imgH - originY);

      // Image.getSize returns actual file pixel dimensions. expo-image-manipulator uses
      // the same file pixel coordinate space. No PixelRatio conversion is needed here.

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
          // Cap output so large zoomed-out crops don't produce oversized upload payloads
          cropWidth > cropHeight
            ? { resize: { width: 800 } }
            : { resize: { height: 800 } },
        ],
        { compress: 0.85, format: SaveFormat.JPEG, base64: true }
      );

      if (!result.base64) {
        throw new Error('Crop produced no image data');
      }
      return `data:image/jpeg;base64,${result.base64}`;
    } catch (error) {
      console.error("Native crop failed:", error);
      throw error;
    }
  };

  return (
    <View style={[styles.container, style]}>

      {/* Canvas Area */}
      <View style={styles.canvasWrapper}>
        <View style={[styles.canvas, { width: canvasSize, height: canvasSize }]} {...panResponder.panHandlers}>
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              {
                width: imageDimensions.width * zoom,
                height: imageDimensions.height * zoom,
                left: (canvasSize - imageDimensions.width * zoom) / 2,
                top: (canvasSize - imageDimensions.height * zoom) / 2,
                transform: [{ translateX: offsetX }, { translateY: offsetY }],
              },
            ]}
            resizeMode="contain"
            onLoad={handleImageLoad}
          />

          {/* Fixed 1:1 Crop Frame */}
          <View style={[styles.cropFrame, { width: canvasSize, height: canvasSize }]} />
        </View>
      </View>

      {/* Zoom Slider - Clean Interface */}
      <View style={styles.sliderContainer}>
        <CropperSlider
          value={zoom}
          onValueChange={handleZoomChange}
          minimumValue={minZoom}
          maximumValue={3}
          step={0.05}
          containerWidth={canvasSize}
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.semantic.background,
    padding: spacing.lg,
    width: "100%",
  },
  canvasWrapper: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  canvas: {
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
    borderWidth: 2,
    borderColor: colors.primary[500],
    pointerEvents: "none",
  },
  sliderContainer: {
    width: "100%",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
