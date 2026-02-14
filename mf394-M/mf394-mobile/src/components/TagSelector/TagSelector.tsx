/**
 * Tag Selector Component
 *
 * Displays prepopulated tags as selectable buttons.
 * Used in contact forms to select from available tags.
 * Tag management is done in a separate interface.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface TagSelectorProps {
  availableTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onEditTags?: () => void;
  style?: ViewStyle;
}

export function TagSelector({
  availableTags,
  selectedTags,
  onTagsChange,
  onEditTags,
  style,
}: TagSelectorProps) {
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header with label and edit button */}
      <View style={styles.header}>
        <Text style={styles.label}>Tags</Text>
        {onEditTags && (
          <TouchableOpacity style={styles.editButton} onPress={onEditTags}>
            <FontAwesome name="edit" size={16} color={colors.primary[500]} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tags Grid */}
      {availableTags.length > 0 ? (
        <View style={styles.tagsContainer}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  isSelected && styles.tagButtonSelected,
                ]}
                onPress={() => handleToggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagLabel,
                    isSelected && styles.tagLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tags available</Text>
          {onEditTags && (
            <TouchableOpacity
              style={styles.addFirstTagButton}
              onPress={onEditTags}
            >
              <FontAwesome name="plus" size={16} color="#fff" />
              <Text style={styles.addFirstTagText}>Add Tags</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  editButtonText: {
    fontSize: typography.body.small.fontSize,
    fontWeight: '600',
    color: colors.primary[500],
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tagButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: radii.xl,
    backgroundColor: colors.semantic.surface,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  tagLabel: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  tagLabelSelected: {
    color: colors.primary[500],
  },
  emptyContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
  },
  addFirstTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: radii.md,
  },
  addFirstTagText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
});
