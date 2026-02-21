/**
 * Party Mode Screen
 *
 * Allows users to upload group photos and create multiple contacts at once.
 *
 * Flow:
 * 1. Upload image
 * 2. Face detection (loading)
 * 3. Name each face (validation: red → green border)
 * 4. Select category + tags
 * 5. Bulk save (create all validated contacts via API)
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { showAlert } from "../../utils/showAlert";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { ImageSelector } from "../../components/ImageSelector";
import { BulkNamer, NamedFace } from "../../components/BulkNamer";
import { CategoryTagsStep } from "../../components/CategoryTagsStep";
import { FormButtons } from "../../components/FormButtons";
import { FormGroup } from "../../components/FormGroup";
import { LoadingState } from "../../components/LoadingState";
import { InfoBox } from "../../components/InfoBox";
import { Cropper } from "../../components/Cropper";
import { FullScreenSpinner } from "../../components/FullScreenSpinner";
import { useFaceDetection } from "../../hooks/useFaceDetection";
import { useCreateContactMutation } from "../../store/api/contacts.api";
import { useUploadImageMutation } from "../../store/api/upload.api";
import { CATEGORIES, DEFAULT_CATEGORY } from "../../constants";
import { cropFaceWithBounds } from "../../utils/imageCropping";
import { TagManagementView } from "../../components/TagManagementView";

type Step = "upload" | "detecting" | "naming" | "category" | "crop";
type ViewMode = "category" | "tagManagement";

export default function PartyModeScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>("upload");
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Array<{ id: string; uri: string }>>([]);
  const [namedFaces, setNamedFaces] = useState<NamedFace[]>([]);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step !== "crop" });
  }, [step, navigation]);

  const { detectFaces } = useFaceDetection();
  const [createContact] = useCreateContactMutation();
  const [uploadImage] = useUploadImageMutation();

  const handleImageSelected = async (uri: string) => {
    setUploadedImageUri(uri);
    setStep("detecting");

    try {
      const result = await detectFaces(uri);
      const faces = result?.faces || [];

      if (!faces || faces.length === 0) {
        setStep("crop");
        return;
      }

      const processedFaces = await Promise.all(
        faces.map(async (face, index) => {
          try {
            const croppedUri = await cropFaceWithBounds(uri, face.bounds);
            return { id: `face-${index}`, uri: croppedUri };
          } catch (error) {
            console.warn(`[PartyMode] Failed to crop face ${index}:`, error);
            return { id: `face-${index}`, uri };
          }
        })
      );

      setDetectedFaces(processedFaces);
      setStep("naming");
    } catch (error: any) {
      console.error("[PartyMode] Error during face detection:", error);
      showAlert("Error", "Failed to detect faces. Please try again.");
      setStep("upload");
      setUploadedImageUri(null);
    }
  };

  const handleImageDeleted = () => {
    setUploadedImageUri(null);
    setDetectedFaces([]);
    setNamedFaces([]);
  };

  const handleCropConfirm = async (croppedImageUri: string) => {
    const singleFace = { id: "face-0", uri: croppedImageUri };
    setDetectedFaces([singleFace]);
    setStep("naming");
  };

  const handleCropCancel = () => {
    setStep("upload");
    setUploadedImageUri(null);
  };

  const handleSave = async () => {
    if (namedFaces.length === 0) {
      showAlert("No Names", "Please add at least one name before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const results: string[] = [];
    const errors: string[] = [];

    for (const namedFace of namedFaces) {
      try {
        // Upload photo to S3
        const uploadResult = await uploadImage({
          uri: namedFace.faceUri,
          type: "contact-photo",
          source: "party-mode",
        });
        if ('error' in uploadResult) {
          throw new Error("Upload failed");
        }
        const photoUrl = uploadResult.data?.url || "";

        // Create contact via API
        const createResult = await createContact({
          name: namedFace.name.trim(),
          category: category as any,
          groups: tags,
          photo: photoUrl,
        });
        if ('error' in createResult) {
          throw new Error("Create failed");
        }

        results.push(namedFace.name);
      } catch (error) {
        errors.push(namedFace.name);
        console.error(`Failed to save contact "${namedFace.name}":`, error);
      }
    }

    setIsSaving(false);

    if (results.length > 0 && errors.length === 0) {
      navigation.navigate("Listing" as never, { category, tags } as never);
    } else if (results.length > 0 && errors.length > 0) {
      setSaveError(
        `${results.length} contacts saved. Failed: ${errors.join(", ")}. Tap Save to retry.`
      );
    } else {
      setSaveError("Failed to save contacts. Please check your connection and try again.");
    }
  };

  const handleErrorBack = () => {
    setSaveError(null);
    setIsSaving(false);
  };

  const handleEditTags = () => {
    setViewMode("tagManagement");
  };

  const handleExitTagManagement = () => {
    setViewMode("category");
  };

  return (
    <View style={styles.container}>
      {/* Upload Step */}
      {step === "upload" && (
        <ScrollView style={styles.stepContainer}>
          <FormGroup>
            <ImageSelector
              imageUri={uploadedImageUri}
              onImageSelected={handleImageSelected}
              onImageDeleted={handleImageDeleted}
            />
          </FormGroup>

          <FormGroup>
            <InfoBox text="Upload a photo with multiple faces. We'll detect each person and let you name them.">
              <View style={styles.multifaceImageWrapper}>
                <Image
                  source={require('../../../assets/multiface.png')}
                  style={styles.multifaceImage}
                  resizeMode="contain"
                />
              </View>
            </InfoBox>
          </FormGroup>

          <FormButtons
            cancelButton={{
              label: "Back",
              icon: "arrow-left",
              onPress: () => navigation.goBack(),
            }}
          />
        </ScrollView>
      )}

      {/* Face Detection Step */}
      {step === "detecting" && (
        <View style={styles.stepContainer}>
          <LoadingState title="Detecting Faces" subtitle="Analyzing your photo..." />
        </View>
      )}

      {/* Naming Step */}
      {step === "naming" && detectedFaces.length > 0 && (
        <ScrollView style={styles.namingStepContainer}>
          <BulkNamer
            faces={detectedFaces}
            onNamesChange={setNamedFaces}
            initialNames={namedFaces}
            style={styles.bulkNamerContent}
          />

          <View style={styles.buttonFooter}>
            <FormButtons
              primaryButton={{
                label: `Continue (${namedFaces.length})`,
                icon: "arrow-right",
                onPress: () => setStep("category"),
                disabled: !namedFaces.length,
              }}
              cancelButton={{
                label: "Back to Upload",
                icon: "arrow-left",
                onPress: () => {
                  setStep("upload");
                  setUploadedImageUri(null);
                  setDetectedFaces([]);
                  setNamedFaces([]);
                },
              }}
            />
          </View>
        </ScrollView>
      )}

      {/* Category + Tags Step */}
      {step === "category" && (
        <>
          {viewMode === "category" && (
            <CategoryTagsStep
              contactCount={namedFaces.length}
              category={category}
              tags={tags}
              categories={CATEGORIES}
              contacts={namedFaces.map((face) => ({
                id: face.id,
                name: face.name,
              }))}
              onCategoryChange={setCategory}
              onTagsChange={setTags}
              onEditTags={handleEditTags}
              onSave={handleSave}
              onBack={() => setStep("naming")}
              isSaving={isSaving}
            />
          )}

          {viewMode === "tagManagement" && <TagManagementView onExit={handleExitTagManagement} />}
        </>
      )}

      {/* Manual Crop Step */}
      {step === "crop" && uploadedImageUri && (
        <Cropper
          imageUri={uploadedImageUri}
          onCropConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          style={styles.stepContainer}
        />
      )}

      {/* Full-Screen Spinner */}
      <FullScreenSpinner
        visible={isSaving && !saveError}
        variant="loading"
        message={`Saving ${namedFaces.length} contact${namedFaces.length !== 1 ? "s" : ""}...`}
      />

      {/* Error State */}
      <FullScreenSpinner
        visible={!!saveError}
        variant="error"
        errorMessage={saveError || ""}
        onBack={handleErrorBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  namingStepContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: "column",
    backgroundColor: colors.semantic.background,
  },
  bulkNamerContent: {
    flex: 1,
  },
  multifaceImageWrapper: {
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: -spacing.xs,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  multifaceImage: {
    width: 200,
    height: 200,
  },
  buttonFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.semantic.background,
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
  },
});
