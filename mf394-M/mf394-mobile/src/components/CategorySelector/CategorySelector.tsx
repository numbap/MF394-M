import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";

export interface Category {
  label: string;
  value: string;
  icon: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function CategorySelector({
  categories,
  selectedValue,
  onSelect,
  label = "Category",
  required = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCategory = categories.find((c) => c.value === selectedValue);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={() => setIsOpen(true)} activeOpacity={0.7}>
        <View style={styles.buttonContent}>
          {selectedCategory && (
            <>
              <FontAwesome
                name={selectedCategory.icon as any}
                size={18}
                color={colors.semantic.text}
              />
              <Text style={styles.buttonText}>{selectedCategory.label}</Text>
            </>
          )}
        </View>
        <FontAwesome name="chevron-down" size={16} color={colors.semantic.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={styles.optionsList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[styles.option, selectedValue === category.value && styles.optionSelected]}
                  onPress={() => {
                    onSelect(category.value);
                    setIsOpen(false);
                  }}
                >
                  <FontAwesome
                    name={category.icon as any}
                    size={20}
                    color={
                      selectedValue === category.value ? colors.primary[500] : colors.semantic.text
                    }
                  />
                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedValue === category.value && styles.optionLabelSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </View>
                  {selectedValue === category.value && (
                    <FontAwesome name="check" size={18} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    backgroundColor: colors.semantic.surface,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  buttonText: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.text,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.semantic.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "80%",
    paddingTop: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.title.medium.fontSize,
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  optionsList: {
    maxHeight: "100%",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  optionSelected: {
    backgroundColor: colors.primary[50],
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.text,
    fontWeight: "500",
  },
  optionLabelSelected: {
    color: colors.primary[500],
    fontWeight: "600",
  },
});
