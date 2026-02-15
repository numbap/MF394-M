/**
 * Tag Management Modal Component
 *
 * Bottom sheet modal for managing global tag list.
 * Allows users to add new tags and delete existing ones.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';
import { selectAllTags, addTag, deleteTag } from '../../store/slices/tags.slice';
import { removeTagFromAllContacts } from '../../store/slices/contacts.slice';
import { useConfirmTagDelete } from '../../hooks/useConfirmTagDelete';

export interface TagManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TagManagementModal({ visible, onClose }: TagManagementModalProps) {
  const dispatch = useDispatch();
  const tags = useSelector(selectAllTags);
  const { confirmDelete } = useConfirmTagDelete();

  const [newTagInput, setNewTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizeTag = (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  const validateTag = (input: string): string | null => {
    const trimmed = input.trim();

    if (trimmed.length === 0) {
      return 'Tag name cannot be empty';
    }

    if (trimmed.length > 30) {
      return 'Tag name must be 30 characters or less';
    }

    const normalized = normalizeTag(trimmed);

    if (tags.some(tag => tag.toLowerCase() === normalized)) {
      return 'This tag already exists';
    }

    return null; // Valid
  };

  const handleAddTag = () => {
    const error = validateTag(newTagInput);

    if (error) {
      setErrorMessage(error);
      setSuccessMessage(null);
      return;
    }

    const normalized = normalizeTag(newTagInput);
    dispatch(addTag(normalized));

    // Show success message
    setSuccessMessage(`Tag '${normalized}' added`);
    setErrorMessage(null);
    setNewTagInput('');

    // Clear success message after 2 seconds
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleDeleteTag = async (tagName: string) => {
    const confirmed = await confirmDelete(tagName);

    if (confirmed) {
      dispatch(deleteTag(tagName));
      dispatch(removeTagFromAllContacts(tagName));

      // Show success message
      setSuccessMessage(`Tag '${tagName}' deleted`);
      setErrorMessage(null);

      // Clear success message after 2 seconds
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleInputChange = (text: string) => {
    setNewTagInput(text);
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleClose = () => {
    setNewTagInput('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Manage Tags</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <FontAwesome name="times" size={24} color={colors.semantic.text} />
            </TouchableOpacity>
          </View>

          {/* Success Message */}
          {successMessage && (
            <View style={styles.successBanner}>
              <FontAwesome name="check-circle" size={16} color={colors.semantic.success} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Add Tag Section */}
          <View style={styles.addSection}>
            <Text style={styles.sectionLabel}>Add New Tag</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, errorMessage && styles.inputError]}
                placeholder="e.g., mentor-advisor"
                value={newTagInput}
                onChangeText={handleInputChange}
                placeholderTextColor={colors.semantic.textTertiary}
                maxLength={30}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addButton, !newTagInput.trim() && styles.addButtonDisabled]}
                onPress={handleAddTag}
                disabled={!newTagInput.trim()}
              >
                <FontAwesome name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Inline Error Message */}
            {errorMessage && (
              <View style={styles.errorContainer}>
                <FontAwesome name="exclamation-circle" size={14} color={colors.semantic.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          {/* Tags List */}
          <View style={styles.listSection}>
            <Text style={styles.sectionLabel}>
              Existing Tags ({tags.length})
            </Text>
            <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={true}>
              {tags.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <FontAwesome name="tags" size={32} color={colors.semantic.textTertiary} />
                  <Text style={styles.emptyText}>No tags yet</Text>
                  <Text style={styles.emptySubtext}>Add your first tag above</Text>
                </View>
              ) : (
                tags.map((tag) => (
                  <View key={tag} style={styles.tagItem}>
                    <Text style={styles.tagName}>{tag}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTag(tag)}
                    >
                      <FontAwesome name="trash" size={16} color={colors.accent[500]} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.semantic.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingTop: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xxxl : spacing.lg,
    maxHeight: '80%',
    ...shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.semantic.success + '15', // 15% opacity
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.success,
  },
  successText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.success,
  },
  addSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    flex: 1,
  },
  tagsList: {
    flex: 1,
  },
  tagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  tagName: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.text,
    flex: 1,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.body.large.fontSize,
    fontWeight: '600',
    color: colors.semantic.textSecondary,
  },
  emptySubtext: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textTertiary,
  },
});
