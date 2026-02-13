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

  // Split tags into rows of 2
  const tagRows = [];
  for (let i = 0; i < availableTags.length; i += 2) {
    tagRows.push(availableTags.slice(i, i + 2));
  }

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
        <View>
          {tagRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tagRow}>
              {row.map((tag) => {
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
                    {isSelected && (
                      <FontAwesome
                        name="check"
                        size={14}
                        color={colors.primary[500]}
                        style={styles.checkIcon}
                      />
                    )}
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
          ))}
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
  tagRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tagButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: radii.md,
    backgroundColor: colors.semantic.surface,
    minHeight: 44,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  checkIcon: {
    marginRight: spacing.xs,
  },
  tagLabel: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '500',
    color: colors.semantic.text,
    flex: 1,
  },
  tagLabelSelected: {
    color: colors.primary[500],
    fontWeight: '600',
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
