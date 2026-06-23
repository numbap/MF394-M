import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
} from "react-native";
import { FormButtons } from "../FormButtons";
import { CropperSlider } from "./CropperSlider";
import { colors, spacing, radii, shadows, typography } from "../../theme/theme";
import { cropImageNative } from "./cropImageNative";
import { useMobileCropperGestures } from "./useMobileCropperGestures";
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

  // Refs mirror state so gesture callbacks always read current values
  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const imageDimensionsRef = useRef({ width: 0, height: 0 });
  const zoomRef = useRef(1);
  const minZoomRef = useRef(0.1);

  // Use manipulateAsync (not Image.getSize) to get post-EXIF dimensions — Android
  // ignores EXIF rotation with Image.getSize, but manipulateAsync applies it.
  useEffect(() => {
    let cancelled = false;
    const { manipulateAsync } = require("expo-image-manipulator");
    manipulateAsync(imageUri, [])
      .then((probe: { width: number; height: number }) => {
        if (cancelled) return;
        const { width: w, height: h } = probe;
        setImageDimensions({ width: w, height: h });
        imageDimensionsRef.current = { width: w, height: h };
        const fitZoom = Math.min(canvasSizeRef.current / w, canvasSizeRef.current / h);
        setMinZoom(fitZoom);
        minZoomRef.current = fitZoom;
        setZoom(fitZoom);
        zoomRef.current = fitZoom;
      })
      .catch((err: any) => {
        if (!cancelled) console.warn("MobileCropper: failed to probe image size", err);
      });
    return () => { cancelled = true; };
  }, [imageUri]);

  const panResponder = useMobileCropperGestures({
    zoomRef,
    minZoomRef,
    offsetXRef,
    offsetYRef,
    imageDimensionsRef,
    canvasSizeRef,
    setZoom: (v) => { setZoom(v); zoomRef.current = v; },
    setOffsetX: (v) => { setOffsetX(v); offsetXRef.current = v; },
    setOffsetY: (v) => { setOffsetY(v); offsetYRef.current = v; },
  });

  // Reset pan offsets on load; dimensions/zoom are managed by the useEffect above.
  const handleImageLoad = (_e: any) => {
    setOffsetX(0); offsetXRef.current = 0;
    setOffsetY(0); offsetYRef.current = 0;
  };

  const handleZoomChange = (value: number) => {
    setZoom(value); zoomRef.current = value;
    setOffsetX(0); offsetXRef.current = 0;
    setOffsetY(0); offsetYRef.current = 0;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const croppedUri = await cropImageNative({
        imageUri,
        imageDimensions: imageDimensionsRef.current,
        zoom: zoomRef.current,
        offsetX: offsetXRef.current,
        offsetY: offsetYRef.current,
        canvasSize: canvasSizeRef.current,
      });
      onCropConfirm(croppedUri);
    } catch (error) {
      console.error("Cropping failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Crop Photo</Text>

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
