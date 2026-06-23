import React, { useState } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { FormButtons } from "../FormButtons";
import { CropperSlider } from "./CropperSlider";
import { colors, spacing, radii, typography } from "../../theme/theme";
import type { CropperProps } from "./Cropper";

export function WebCropper({ imageUri, onCropConfirm, onCancel }: CropperProps) {
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
          touchAction: "none",
        }}
      >
        <EasyCrop
          image={imageUri}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropSize={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
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
        <CropperSlider
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.semantic.background,
    padding: spacing.lg,
    width: "100%",
  },
  sliderContainer: {
    width: "100%",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
