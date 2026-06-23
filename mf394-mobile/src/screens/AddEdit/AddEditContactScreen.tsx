/**
 * Add/Edit Contact Screen — Orchestrator
 *
 * Owns: Redux selectors/dispatch, form state, image processing logic,
 * form submission, navigation.
 *
 * Delegates UI rendering to:
 *   - ContactFormSteps  (details form + tag management)
 *   - ContactPhotoStep  (face detection / face selection / crop steps)
 *
 * Image upload flow:
 * 1. Upload image → scan for faces
 * 2a. No faces → manual cropper
 * 2b. Faces detected → face selector grid
 * 3. Save photo locally, upload to S3 on form submit
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { showAlert } from "../../utils/showAlert";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../theme/theme";
import {
  useGetUserQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "../../store/api/contacts.api";
import { useUploadImageMutation } from "../../store/api/upload.api";
import { Face } from "../../components/FaceSelector";
import { FullScreenSpinner } from "../../components/FullScreenSpinner";
import { Toast } from "../../components/Toast";
import { useFaceDetection } from "../../hooks/useFaceDetection";
import { DEFAULT_CATEGORY } from "../../constants";
import { cropFaceWithBounds } from "../../utils/imageCropping";
import { ContactFormSteps } from "./ContactFormSteps";
import { ContactPhotoStep } from "./ContactPhotoStep";

type Step = "details" | "faceDetection" | "faceSelection" | "crop";
type ViewMode = "details" | "tagManagement";

export default function AddEditContactScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>("details");
  const [viewMode, setViewMode] = useState<ViewMode>("details");
  const [isLoading, setIsLoading] = useState(false);

  const contactId = (route.params as any)?.contactId;
  const isEditing = !!contactId;

  // Get contacts from RTK Query cache
  const { data: userData } = useGetUserQuery();
  const contacts = userData?.contacts || [];
  const existingContact = isEditing ? contacts.find((c) => c._id === contactId) : null;

  // RTK Query mutations
  const [createContact] = useCreateContactMutation();
  const [updateContact] = useUpdateContactMutation();
  const [deleteContactMutation] = useDeleteContactMutation();
  const [uploadImage] = useUploadImageMutation();

  // Form state
  const [name, setName] = useState("");
  const [hint, setHint] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Image processing state
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Face[]>([]);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("success");

  // Save state
  const [saveError, setSaveError] = useState<string | null>(null);

  const { detectFaces } = useFaceDetection();

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step !== "crop" });
  }, [step, navigation]);

  useEffect(() => {
    if (existingContact) {
      setName(existingContact.name);
      setHint(existingContact.hint || "");
      setSummary(existingContact.summary || "");
      setCategory(existingContact.category);
      setTags(existingContact.groups || []);
      setPhotoUri(existingContact.photo || null);
    }
  }, [existingContact]);

  const handleImageSelected = async (uri: string) => {
    setUploadedImageUri(uri);
    setStep("faceDetection");

    try {
      const result = await detectFaces(uri);
      const { faces, isRealDetection, nativeError } = result as any;

      if (nativeError) {
        setToastMessage(`Face detection error: ${nativeError}`);
        setToastVariant("error");
        setShowToast(true);
      }

      if (isRealDetection && faces && faces.length > 0) {
        const croppedFaces = await Promise.all(
          faces.map(async (face) => {
            try {
              const croppedUri = await cropFaceWithBounds(uri, face.bounds);
              return { ...face, uri: croppedUri };
            } catch (err) {
              console.error(`Failed to crop face ${face.id}:`, err);
              return face;
            }
          })
        );
        setDetectedFaces(croppedFaces);
        setStep("faceSelection");
      } else {
        setStep("crop");
      }
    } catch (error) {
      showAlert("Error", "Failed to process image. Please try again.");
      setStep("details");
      setUploadedImageUri(null);
    }
  };

  const handleFaceSelected = async (faceIndex: number) => {
    setIsLoading(true);
    try {
      const selectedFace = detectedFaces[faceIndex];
      if (!selectedFace) {
        throw new Error("Face not found");
      }
      setPhotoUri(selectedFace.uri);
      setStep("details");
    } catch (error: any) {
      console.error("Image processing failed:", error);
      showAlert("Error", error?.message || "Failed to process image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropManually = () => {
    setStep("crop");
  };

  const handleCropConfirm = async (croppedImageUri: string) => {
    try {
      setIsLoading(true);
      setPhotoUri(croppedImageUri);
      setStep("details");
    } catch (error: any) {
      console.error("Crop failed:", error);
      showAlert("Error", error?.message || "Failed to process image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropCancel = () => {
    setStep("details");
    setUploadedImageUri(null);
  };

  const handleImageDeleted = () => {
    setPhotoUri(null);
  };

  const isFormValid = () => {
    const hasName = name.trim().length > 0;
    const hasImage = photoUri !== null;
    const hasHint = hint.trim().length > 0;
    return hasName && (hasImage || hasHint);
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      if (!name.trim()) {
        showAlert("Error", "Please enter a name");
      } else {
        showAlert("Error", "Please provide either a photo or a hint");
      }
      return;
    }

    try {
      setIsLoading(true);
      setSaveError(null);

      let finalPhotoUrl: string | undefined = photoUri?.startsWith("http")
        ? photoUri
        : undefined;

      if (photoUri && !photoUri.startsWith("http")) {
        const uploadResult = await uploadImage({
          uri: photoUri,
          type: "contact-photo",
          source: isEditing ? "edit-contact" : "add-contact",
        });
        if ("error" in uploadResult) {
          throw new Error("Image upload failed. Please try again.");
        }
        finalPhotoUrl = uploadResult.data?.url;
        if (!finalPhotoUrl) {
          throw new Error("Image upload failed. Please try again.");
        }
      }

      const contactData = {
        name: name.trim(),
        hint: hint.trim() || undefined,
        summary: summary.trim() || undefined,
        category: category as any,
        groups: tags,
        photo: finalPhotoUrl,
      };

      if (isEditing && existingContact) {
        const result = await updateContact({ id: existingContact._id, data: contactData });
        if ("error" in result) {
          console.error("updateContact error:", JSON.stringify(result.error));
          throw new Error("Failed to update contact. Please try again.");
        }
      } else {
        const result = await createContact(contactData);
        if ("error" in result) {
          console.error("createContact error:", result.error);
          throw new Error("Failed to create contact. Please try again.");
        }
      }

      navigation.navigate("Listing" as never, { category, tags } as never);
    } catch (error: any) {
      console.error("Save failed:", error);
      setSaveError(error?.message || "Failed to save contact");
    } finally {
      setIsLoading(false);
    }
  };

  const handleErrorBack = () => {
    setSaveError(null);
    setIsLoading(false);
  };

  const handleDelete = () => {
    if (!isEditing || !contactId) return;

    showAlert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            setIsLoading(true);
            const result = await deleteContactMutation(contactId);
            if ("error" in result) {
              throw new Error("Failed to delete contact.");
            }
            setToastMessage("Contact deleted successfully");
            setToastVariant("success");
            setShowToast(true);
            setTimeout(() => {
              navigation.goBack();
            }, 500);
          } catch (error: any) {
            setToastMessage(error?.message || "Failed to delete contact");
            setToastVariant("error");
            setShowToast(true);
          } finally {
            setIsLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {step === "details" ? (
        <ContactFormSteps
          viewMode={viewMode}
          photoUri={photoUri}
          name={name}
          hint={hint}
          summary={summary}
          category={category}
          tags={tags}
          isEditing={isEditing}
          isLoading={isLoading}
          isFormValid={isFormValid()}
          onImageSelected={handleImageSelected}
          onImageDeleted={handleImageDeleted}
          onNameChange={setName}
          onHintChange={setHint}
          onSummaryChange={setSummary}
          onCategoryChange={setCategory}
          onTagsChange={setTags}
          onEditTags={() => setViewMode("tagManagement")}
          onExitTagManagement={() => setViewMode("details")}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => navigation.goBack()}
        />
      ) : (
        <ContactPhotoStep
          step={step}
          uploadedImageUri={uploadedImageUri}
          detectedFaces={detectedFaces}
          isLoading={isLoading}
          onFaceSelected={handleFaceSelected}
          onCropManually={handleCropManually}
          onCropConfirm={handleCropConfirm}
          onCropCancel={handleCropCancel}
          onBackToDetails={() => setStep("details")}
        />
      )}

      <FullScreenSpinner
        visible={isLoading && !saveError}
        variant="loading"
        message={isEditing ? "Updating contact..." : "Adding contact..."}
      />

      <FullScreenSpinner
        visible={!!saveError}
        variant="error"
        errorMessage={saveError || ""}
        onBack={handleErrorBack}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          variant={toastVariant}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
});
