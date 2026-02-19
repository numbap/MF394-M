/**
 * Category Tags Step Component
 *
 * Allows users to select a category and tags for bulk contact import.
 * Displays a preview of contacts to be created.
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { Category } from "../CategorySelector";
import { CategoryTagSelector } from "../CategoryTagSelector";
import { FormGroup } from "../FormGroup";
import { FormButtons } from "../FormButtons";

export interface ContactPreview {
  id: string;
  name: string;
}

interface CategoryTagsStepProps {
  contactCount: number;
  category: string;
  tags: string[];
  categories: Category[];
  contacts: ContactPreview[];
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onEditTags: () => void;
  onSave: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function CategoryTagsStep({
  contactCount,
  category,
  tags,
  categories,
  contacts,
  onCategoryChange,
  onTagsChange,
  onEditTags,
  onSave,
  onBack,
  isSaving = false,
}: CategoryTagsStepProps) {
  const canSave = contactCount > 0 && !isSaving;

  return (
    <ScrollView style={styles.stepContainer}>
      {/* Category and Tags Selection */}
      <FormGroup>
        <CategoryTagSelector
          categories={categories}
          selectedCategory={category}
          onCategoryChange={onCategoryChange}
          selectedTags={tags}
          onTagsChange={onTagsChange}
          onEditTags={onEditTags}
        />
      </FormGroup>

      {/* Contact List Preview */}
      <View style={styles.previewBox}>
        {contacts.map((contact, index) => (
          <View key={contact.id} style={styles.previewItem}>
            <Text style={styles.previewItemNumber}>{index + 1}.</Text>
            <Text style={styles.previewItemName}>{contact.name}</Text>
          </View>
        ))}
      </View>

      {/* Navigation Buttons */}
      <FormButtons
        primaryButton={{
          label: "Save All",
          icon: "save",
          onPress: onSave,
          isLoading: isSaving,
          disabled: !canSave,
        }}
        cancelButton={{
          label: "Back",
          icon: "arrow-left",
          onPress: onBack,
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
  stepTitle: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.lg,
  },
  previewBox: {
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewTitle: {
    fontSize: typography.body.large.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
    marginBottom: spacing.md,
  },
  previewItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  previewItemNumber: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: "600",
    color: colors.semantic.textSecondary,
    width: 24,
  },
  previewItemName: {
    flex: 1,
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
  },
});
