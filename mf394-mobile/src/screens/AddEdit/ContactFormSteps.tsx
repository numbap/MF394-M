/**
 * ContactFormSteps
 *
 * Presentational component for the contact detail form fields:
 * - Photo selector
 * - Name, hint, summary text inputs
 * - Category + tags selector
 * - Action buttons (save, delete, cancel)
 *
 * Receives all values and callbacks as props; contains no business logic.
 */

import React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet } from "react-native";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { ImageSelector } from "../../components/ImageSelector";
import { CategoryTagSelector } from "../../components/CategoryTagSelector";
import { FormButtons } from "../../components/FormButtons";
import { FormGroup } from "../../components/FormGroup";
import { TagManagementView } from "../../components/TagManagementView";
import { CATEGORIES } from "../../constants";

type ViewMode = "details" | "tagManagement";

interface ContactFormStepsProps {
  viewMode: ViewMode;
  photoUri: string | null;
  name: string;
  hint: string;
  summary: string;
  category: string;
  tags: string[];
  isEditing: boolean;
  isLoading: boolean;
  isFormValid: boolean;
  onImageSelected: (uri: string) => void;
  onImageDeleted: () => void;
  onNameChange: (value: string) => void;
  onHintChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onEditTags: () => void;
  onExitTagManagement: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function ContactFormSteps({
  viewMode,
  photoUri,
  name,
  hint,
  summary,
  category,
  tags,
  isEditing,
  isLoading,
  isFormValid,
  onImageSelected,
  onImageDeleted,
  onNameChange,
  onHintChange,
  onSummaryChange,
  onCategoryChange,
  onTagsChange,
  onEditTags,
  onExitTagManagement,
  onSave,
  onDelete,
  onCancel,
}: ContactFormStepsProps) {
  if (viewMode === "tagManagement") {
    return <TagManagementView onExit={onExitTagManagement} />;
  }

  return (
    <ScrollView style={styles.stepContainer}>
      {/* Image Selector */}
      <FormGroup>
        <ImageSelector
          imageUri={photoUri}
          onImageSelected={onImageSelected}
          onImageDeleted={onImageDeleted}
        />
      </FormGroup>

      {/* Name Input */}
      <FormGroup>
        <Text style={styles.label}>
          Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Contact name"
          value={name}
          onChangeText={onNameChange}
          placeholderTextColor={colors.semantic.textTertiary}
        />
      </FormGroup>

      {/* Hint Input */}
      <FormGroup>
        <Text style={styles.label}>Hint</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., tall, red jacket"
          value={hint}
          onChangeText={onHintChange}
          placeholderTextColor={colors.semantic.textTertiary}
        />
      </FormGroup>

      {/* Summary Input */}
      <FormGroup>
        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Notes about this person"
          value={summary}
          onChangeText={onSummaryChange}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.semantic.textTertiary}
        />
      </FormGroup>

      {/* Category and Tags Selection */}
      <FormGroup>
        <CategoryTagSelector
          categories={CATEGORIES}
          selectedCategory={category}
          onCategoryChange={onCategoryChange}
          selectedTags={tags}
          onTagsChange={onTagsChange}
          onEditTags={onEditTags}
        />
      </FormGroup>

      {/* Form Action Buttons */}
      <FormButtons
        primaryButton={{
          label: `${isEditing ? "Save" : "Add"} Contact`,
          icon: "save",
          onPress: onSave,
          isLoading: isLoading,
          disabled: !isFormValid,
        }}
        deleteButton={
          isEditing
            ? {
                label: "",
                icon: "trash",
                onPress: onDelete,
              }
            : undefined
        }
        cancelButton={{
          label: "Cancel",
          onPress: onCancel,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.semantic.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.text,
    backgroundColor: colors.semantic.inputBackground,
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
});
