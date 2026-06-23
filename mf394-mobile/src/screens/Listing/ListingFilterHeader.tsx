/**
 * ListingFilterHeader
 *
 * Presentational header rendered inside the FlatList header slot.
 * Shows category/tag filters, Add/Party action buttons, and view toggle.
 * No Redux, no navigation — receives all data and handlers as props.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { CategoryTagFilter } from "../../components/CategoryTagFilter";
import { FilterContainer } from "../../components/FilterContainer";
import { CATEGORIES } from "../../constants";

interface Category {
  value: string;
  label: string;
}

interface ListingFilterHeaderProps {
  selectedCategories: string[];
  selectedTags: string[];
  availableTags: string[];
  isGalleryView: boolean;
  isOnline: boolean;
  onCategoryPress: (category: string) => void;
  onCategoryLongPress: () => void;
  onTagPress: (tag: string) => void;
  onTagLongPress: () => void;
  onAddPress: () => void;
  onPartyPress: () => void;
  onViewToggle: () => void;
}

export function ListingFilterHeader({
  selectedCategories,
  selectedTags,
  availableTags,
  isGalleryView,
  isOnline,
  onCategoryPress,
  onCategoryLongPress,
  onTagPress,
  onTagLongPress,
  onAddPress,
  onPartyPress,
  onViewToggle,
}: ListingFilterHeaderProps) {
  return (
    <View style={styles.section}>
      <FilterContainer>
        <CategoryTagFilter
          categories={CATEGORIES}
          selectedCategories={selectedCategories}
          onCategoryPress={onCategoryPress}
          onCategoryLongPress={onCategoryLongPress}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagPress={onTagPress}
          onTagLongPress={onTagLongPress}
        />
        <View style={styles.actionRow}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
              onPress={onAddPress}
              disabled={!isOnline}
            >
              <FontAwesome name="user-plus" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
              onPress={onPartyPress}
              disabled={!isOnline}
            >
              <FontAwesome name="users" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Party</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.viewToggle} onPress={onViewToggle}>
            <FontAwesome
              name={isGalleryView ? "address-card" : "th"}
              size={18}
              color={colors.semantic.text}
            />
          </TouchableOpacity>
        </View>
      </FilterContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  actionRow: {
    paddingTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: spacing.md,
    flex: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[500],
    borderRadius: radii.md,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.medium.fontSize,
  },
  viewToggle: {
    marginLeft: spacing.lg,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.md,
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
});
