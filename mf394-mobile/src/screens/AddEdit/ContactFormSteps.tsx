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

export interface FormValues {
  photoUri: string | null;
  name: string;
  hint: string;
  summary: string;
  category: string;
  tags: string[];
}

export interface FormActions {
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

interface ContactFormStepsProps {
  values: FormValues;
  actions: FormActions;
  viewMode: ViewMode;
  isEditing: boolean;
  isLoading: boolean;
  canSave: boolean;
}

export function ContactFormSteps({
  values,
  actions,
  viewMode,
  isEditing,
  isLoading,
  canSave,
}: ContactFormStepsProps) {
  if (viewMode === "tagManagement") {
    return <TagManagementView onExit={actions.onExitTagManagement} />;
  }

  return (
    <ScrollView style={styles.stepContainer}>
      {/* Image Selector */}
      <FormGroup>
        <ImageSelector
          imageUri={values.photoUri}
          onImageSelected={actions.onImageSelected}
          onImageDeleted={actions.onImageDeleted}
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
          value={values.name}
          onChangeText={actions.onNameChange}
          placeholderTextColor={colors.semantic.textTertiary}
        />
      </FormGroup>

      {/* Hint Input */}
      <FormGroup>
        <Text style={styles.label}>Hint</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., tall, red jacket"
          value={values.hint}
          onChangeText={actions.onHintChange}
          placeholderTextColor={colors.semantic.textTertiary}
        />
      </FormGroup>

      {/* Summary Input */}
      <FormGroup>
        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Notes about this person"
          value={values.summary}
          onChangeText={actions.onSummaryChange}
          multiline
          numberOfLines={3}
          placeholderTextColor={colors.semantic.textTertiary}
        />
      </FormGroup>

      {/* Category and Tags Selection */}
      <FormGroup>
        <CategoryTagSelector
          categories={CATEGORIES}
          selectedCategory={values.category}
          onCategoryChange={actions.onCategoryChange}
          selectedTags={values.tags}
          onTagsChange={actions.onTagsChange}
          onEditTags={actions.onEditTags}
        />
      </FormGroup>

      {/* Form Action Buttons */}
      <FormButtons
        primaryButton={{
          label: `${isEditing ? "Save" : "Add"} Contact`,
          icon: "save",
          onPress: actions.onSave,
          isLoading: isLoading,
          disabled: !canSave,
        }}
        deleteButton={
          isEditing
            ? {
                label: "",
                icon: "trash",
                onPress: actions.onDelete,
              }
            : undefined
        }
        cancelButton={{
          label: "Cancel",
          onPress: actions.onCancel,
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
