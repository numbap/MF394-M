/**
 * TagEditor Component
 *
 * Displays tags as editable pills with add/remove functionality.
 * Used for managing tags in contact forms.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii } from '../../theme/theme';

export interface TagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  style?: ViewStyle;
}

export function TagEditor({
  tags,
  onTagsChange,
  placeholder = 'Add tag...',
  maxTags = 10,
  style,
}: TagEditorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onTagsChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const canAddMore = tags.length < maxTags;

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={tags}
        renderItem={({ item, index }) => (
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveTag(index)}>
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
        scrollEnabled={false}
        numColumns={3}
        columnWrapperStyle={styles.tagRow}
      />

      {canAddMore && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleAddTag}
            placeholderTextColor={colors.semantic.textTertiary}
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              !inputValue.trim() && styles.addButtonDisabled,
            ]}
            onPress={handleAddTag}
            disabled={!inputValue.trim()}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  tagRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagPill: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.secondary[100],
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondary[900],
    flex: 1,
  },
  removeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary[900],
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.semantic.text,
  },
  addButton: {
    backgroundColor: colors.primary[500],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  addButtonDisabled: {
    backgroundColor: colors.semantic.disabled,
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
