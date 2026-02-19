/**
 * CategoryTagSelector Component
 *
 * Combines CategorySelector and TagSelector into a single component
 * for consistent category + tag selection across Add/Edit and Party flows.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CategorySelector, Category } from '../CategorySelector';
import { TagSelector } from '../TagSelector';
import { spacing } from '../../theme/theme';

export interface CategoryTagSelectorProps {
  /** Available categories */
  categories: Category[];
  /** Currently selected category */
  selectedCategory: string;
  /** Callback when category changes */
  onCategoryChange: (category: string) => void;
  /** Currently selected tags */
  selectedTags: string[];
  /** Callback when tags change */
  onTagsChange: (tags: string[]) => void;
  /** Callback for edit tags button (optional) */
  onEditTags?: () => void;
  /** Whether category is required */
  categoryRequired?: boolean;
  /** Custom styles */
  style?: ViewStyle;
}

export function CategoryTagSelector({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagsChange,
  onEditTags,
  categoryRequired = true,
  style,
}: CategoryTagSelectorProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Category Selector */}
      <CategorySelector
        categories={categories}
        selectedValue={selectedCategory}
        onSelect={onCategoryChange}
        label="Category"
        required={categoryRequired}
      />

      {/* Tags Selector */}
      <View style={styles.tagsContainer}>
        <TagSelector
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          onEditTags={onEditTags}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tagsContainer: {
    marginTop: spacing.lg,
  },
});
