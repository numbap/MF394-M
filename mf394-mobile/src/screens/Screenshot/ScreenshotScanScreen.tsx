/**
 * ScreenshotScanScreen
 *
 * Multi-step flow to extract contacts from social media screenshots using Gemini Vision.
 *
 * Steps:
 * 1. Upload — pick a screenshot from the library
 * 2. Scanning — show screenshot with loading overlay while calling extract API
 * 3. Results — display extracted people with face regions, checkboxes to select
 * 4. Category — select category + tags, then import selected people as contacts
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { ImageSelector } from "../../components/ImageSelector";
import { CategoryTagsStep } from "../../components/CategoryTagsStep";
import { FormButtons } from "../../components/FormButtons";
import { FormGroup } from "../../components/FormGroup";
import { LoadingState } from "../../components/LoadingState";
import { InfoBox } from "../../components/InfoBox";
import { FullScreenSpinner } from "../../components/FullScreenSpinner";
import { TagManagementView } from "../../components/TagManagementView";
import { useExtractContactsMutation } from "../../store/api/extract.api";
import { useBulkCreateContactsMutation } from "../../store/api/contacts.api";
import { useUploadImageMutation } from "../../store/api/upload.api";
import { getBase64FromUri } from "../../store/api/upload.api";
import { showAlert } from "../../utils/showAlert";
import { CATEGORIES, DEFAULT_CATEGORY } from "../../constants";
import { ExtractResultsList } from "../../components/ExtractResultsList";
import type { ExtractedPerson } from "../../store/api/extract.api";
import type { ContactInput } from "../../store/api/contacts.api";

type Step = "upload" | "scanning" | "results" | "category";
type ViewMode = "category" | "tagManagement";

export default function ScreenshotScanScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>("upload");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [people, setPeople] = useState<ExtractedPerson[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("category");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [extractContacts] = useExtractContactsMutation();
  const [bulkCreateContacts] = useBulkCreateContactsMutation();
  const [uploadImage] = useUploadImageMutation();

  const handleImageSelected = async (uri: string) => {
    setImageUri(uri);
    setStep("scanning");

    try {
      const { base64 } = await getBase64FromUri(uri);
      const result = await extractContacts({ image: base64 });

      if ("error" in result) {
        throw new Error("Extraction failed");
      }

      const extracted = result.data?.people || [];
      if (extracted.length === 0) {
        showAlert("No People Found", "Could not identify any people in this screenshot.");
        setStep("upload");
        setImageUri(null);
        return;
      }

      setPeople(extracted);
      setSelectedIndices(new Set(extracted.map((_, i) => i)));
      setStep("results");
    } catch (error) {
      console.error("[ScreenshotScan] extraction error:", error);
      showAlert("Error", "Failed to analyze screenshot. Please try again.");
      setStep("upload");
      setImageUri(null);
    }
  };

  const handleImageDeleted = () => {
    setImageUri(null);
    setPeople([]);
    setSelectedIndices(new Set());
  };

  const handleTogglePerson = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectedPeople = people.filter((_, i) => selectedIndices.has(i));

  const handleSave = async () => {
    if (selectedPeople.length === 0) {
      showAlert("No Selection", "Please select at least one person to import.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const contactInputs: ContactInput[] = selectedPeople.map((person) => ({
        name: person.name,
        hint: [person.title, person.organization].filter(Boolean).join(" at "),
        category: category as ContactInput["category"],
        groups: tags,
      }));

      const bulkResult = await bulkCreateContacts(contactInputs);
      if ("error" in bulkResult) {
        throw new Error("Bulk create failed");
      }

      setIsSaving(false);
      navigation.navigate("Listing" as never, { category, tags } as never);
    } catch (error) {
      console.error("[ScreenshotScan] save error:", error);
      setIsSaving(false);
      setSaveError("Failed to save contacts. Please check your connection and try again.");
    }
  };

  return (
    <View style={styles.container}>
      {step === "upload" && (
        <ScrollView style={styles.stepContainer}>
          <FormGroup>
            <ImageSelector
              imageUri={imageUri}
              onImageSelected={handleImageSelected}
              onImageDeleted={handleImageDeleted}
            />
          </FormGroup>
          <FormGroup>
            <InfoBox text="Upload a screenshot from LinkedIn, Facebook, or other platforms. We'll extract names, titles, and face positions automatically." />
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

      {step === "scanning" && (
        <View style={styles.stepContainer}>
          <LoadingState title="Analyzing Screenshot" subtitle="Identifying people and extracting details..." />
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          )}
        </View>
      )}

      {step === "results" && (
        <ScrollView style={styles.stepContainer}>
          <ExtractResultsList
            people={people}
            selectedIndices={selectedIndices}
            imageUri={imageUri}
            onTogglePerson={handleTogglePerson}
          />
          <FormButtons
            primaryButton={{
              label: `Import ${selectedPeople.length} Contact${selectedPeople.length !== 1 ? "s" : ""}`,
              icon: "arrow-right",
              onPress: () => setStep("category"),
              disabled: selectedPeople.length === 0,
            }}
            cancelButton={{
              label: "Back",
              icon: "arrow-left",
              onPress: () => {
                setStep("upload");
                setImageUri(null);
                setPeople([]);
                setSelectedIndices(new Set());
              },
            }}
          />
        </ScrollView>
      )}

      {step === "category" && (
        <>
          {viewMode === "category" && (
            <CategoryTagsStep
              contactCount={selectedPeople.length}
              category={category}
              tags={tags}
              categories={CATEGORIES}
              contacts={selectedPeople.map((p, i) => ({ id: String(i), name: p.name }))}
              onCategoryChange={setCategory}
              onTagsChange={setTags}
              onEditTags={() => setViewMode("tagManagement")}
              onSave={handleSave}
              onBack={() => setStep("results")}
              isSaving={isSaving}
            />
          )}
          {viewMode === "tagManagement" && (
            <TagManagementView onExit={() => setViewMode("category")} />
          )}
        </>
      )}

      <FullScreenSpinner
        visible={isSaving && !saveError}
        variant="loading"
        message={`Saving ${selectedPeople.length} contact${selectedPeople.length !== 1 ? "s" : ""}...`}
      />
      <FullScreenSpinner
        visible={!!saveError}
        variant="error"
        errorMessage={saveError || ""}
        onBack={() => {
          setSaveError(null);
          setIsSaving(false);
        }}
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
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    opacity: 0.5,
  },
});
