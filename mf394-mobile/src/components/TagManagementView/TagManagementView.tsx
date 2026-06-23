import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { selectAllTags, addTag, deleteTag } from '../../store/slices/tags.slice';
import { removeTagFromAllContacts } from '../../store/slices/contacts.slice';
import { useConfirmTagDelete } from '../../hooks/useConfirmTagDelete';
import { FormButtons } from '../FormButtons';
import { TagList } from './TagList';

export interface TagManagementViewProps {
  onExit: () => void;
}

export function TagManagementView({ onExit }: TagManagementViewProps) {
  const dispatch = useDispatch();
  const tags = useSelector(selectAllTags);
  const { confirmDelete } = useConfirmTagDelete();

  const [newTagInput, setNewTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizeTag = (input: string) => input.toUpperCase().trim();

  const validateTag = (input: string): string | null => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return 'Tag name cannot be empty';
    if (trimmed.length > 30) return 'Tag name must be 30 characters or less';
    if (tags.some(tag => tag.toUpperCase() === normalizeTag(trimmed))) return 'This tag already exists';
    return null;
  };

  const handleAddTag = () => {
    const error = validateTag(newTagInput);
    if (error) { setErrorMessage(error); return; }
    dispatch(addTag(normalizeTag(newTagInput)));
    setErrorMessage(null);
    setNewTagInput('');
  };

  const handleDeleteTag = async (tagName: string) => {
    const confirmed = await confirmDelete(tagName);
    if (confirmed) {
      dispatch(deleteTag(tagName));
      dispatch(removeTagFromAllContacts(tagName));
    }
  };

  const handleInputChange = (text: string) => {
    // Strip non-alphanumeric/space/hyphen; uppercase handled by autoCapitalize + normalizeTag on submit
    const sanitized = text.replace(/[^A-Za-z0-9 -]/g, '');
    setNewTagInput(sanitized);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Manage Tags</Text>
      <View style={styles.addSection}>
        <Text style={styles.sectionLabel}>Add New Tag</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, errorMessage && styles.inputError]}
            placeholder="e.g., MENTOR-ADVISOR"
            value={newTagInput}
            onChangeText={handleInputChange}
            placeholderTextColor={colors.semantic.textTertiary}
            maxLength={30}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            testID="tag-input"
          />
          <Pressable
            style={[styles.addButton, !newTagInput.trim() && styles.addButtonDisabled]}
            onPress={handleAddTag}
            disabled={!newTagInput.trim()}
            testID="add-tag-button"
          >
            <FontAwesome name="plus" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer} testID="error-message">
            <FontAwesome name="exclamation-circle" size={14} color={colors.semantic.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionLabel}>Existing Tags ({tags.length})</Text>
        <TagList tags={tags} onDeleteTag={handleDeleteTag} />
      </View>

      <FormButtons
        cancelButton={{
          label: 'Back to Form',
          icon: 'arrow-left',
          onPress: onExit,
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.surface,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.title.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  addSection: {
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.text,
    backgroundColor: colors.semantic.inputBackground,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.error,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  addButtonDisabled: {
    backgroundColor: colors.semantic.disabled,
  },
  addButtonText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
  listSection: {
    flex: 1,
  },
});
