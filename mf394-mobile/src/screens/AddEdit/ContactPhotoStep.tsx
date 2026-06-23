/**
 * ContactPhotoStep
 *
 * Presentational component for the photo capture/processing steps:
 * - faceDetection: loading spinner while scanning
 * - faceSelection: grid of detected faces to choose from
 * - crop: manual crop tool
 *
 * The "details" step is NOT rendered here — see ContactFormSteps.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { FaceSelector, Face } from "../../components/FaceSelector";
import { Cropper } from "../../components/Cropper";
import { LoadingState } from "../../components/LoadingState";

type Step = "details" | "faceDetection" | "faceSelection" | "crop";

interface ContactPhotoStepProps {
  step: Step;
  uploadedImageUri: string | null;
  detectedFaces: Face[];
  isLoading: boolean;
  onFaceSelected: (faceIndex: number) => void;
  onCropManually: () => void;
  onCropConfirm: (croppedImageUri: string) => void;
  onCropCancel: () => void;
  onBackToDetails: () => void;
}

export function ContactPhotoStep({
  step,
  uploadedImageUri,
  detectedFaces,
  isLoading,
  onFaceSelected,
  onCropManually,
  onCropConfirm,
  onCropCancel,
  onBackToDetails,
}: ContactPhotoStepProps) {
  if (step === "faceDetection") {
    return (
      <View style={styles.stepContainer}>
        <LoadingState title="Scanning for Faces" subtitle="Analyzing your photo..." />
      </View>
    );
  }

  if (step === "faceSelection" && detectedFaces.length > 0) {
    return (
      <View style={styles.stepContainer}>
        <FaceSelector
          faces={detectedFaces}
          onSelectFace={onFaceSelected}
          onCropInstead={onCropManually}
          isLoading={isLoading}
        />
        <TouchableOpacity style={styles.secondaryButton} onPress={onBackToDetails}>
          <Text style={styles.secondaryButtonText}>Back to Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === "crop" && uploadedImageUri) {
    return (
      <Cropper
        imageUri={uploadedImageUri}
        onCropConfirm={onCropConfirm}
        onCancel={onCropCancel}
        style={styles.stepContainer}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  secondaryButton: {
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.semantic.text,
    fontWeight: "600",
    fontSize: typography.body.large.fontSize,
  },
});
