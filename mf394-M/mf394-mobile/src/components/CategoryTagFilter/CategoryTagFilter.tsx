/**
 * CategoryTagFilter
 *
 * Reusable component for filtering by categories with icon buttons.
 * Features:
 * - Press to select/deselect individual categories
 * - Long-press to select/deselect all categories
 * - Yellow theme for selected state
 * - Dynamic header text based on selection
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";

export interface CategoryItem {
  label: string;
  value: string;
  icon: string;
}

export interface CategoryTagFilterProps {
  categories: CategoryItem[];
  selectedCategories: string[];
  onCategoryPress: (category: string) => void;
  onCategoryLongPress: () => void;
}

export function CategoryTagFilter({
  categories,
  selectedCategories,
  onCategoryPress,
  onCategoryLongPress,
}: CategoryTagFilterProps) {
  // Get category header text based on selection
  const getCategoryHeader = () => {
    if (selectedCategories.length === 0) {
      return "Select a Category";
    }
    if (selectedCategories.length === 1) {
      return categories.find((c) => c.value === selectedCategories[0])?.label || "";
    }
    if (selectedCategories.length === 2) {
      const labels = selectedCategories
        .map((cat) => categories.find((c) => c.value === cat)?.label)
        .filter(Boolean);
      return labels.join(" + ");
    }
    return "Multiple Selected";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.filterHeader}>{getCategoryHeader()}</Text>

      {/* Category Icons */}
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <Pressable
            key={cat.value}
            onPress={() => onCategoryPress(cat.value)}
            onLongPress={onCategoryLongPress}
            delayLongPress={500}
            accessibilityRole="button"
            accessibilityLabel={`${cat.label} category`}
            accessibilityState={{ selected: selectedCategories.includes(cat.value) }}
            testID={`category-button-${cat.value}`}
            style={[
              styles.categoryButton,
              selectedCategories.includes(cat.value) && styles.categoryButtonSelected,
            ]}
          >
            <FontAwesome
              name={cat.icon as any}
              size={24}
              color={
                selectedCategories.includes(cat.value)
                  ? colors.secondary[500]
                  : colors.semantic.textSecondary
              }
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  filterHeader: {
    fontSize: typography.title.large.fontSize,
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryButton: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.semantic.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.semantic.surface,
  },
  categoryButtonSelected: {
    borderColor: colors.secondary[500],
    backgroundColor: colors.secondary[50],
  },
});
