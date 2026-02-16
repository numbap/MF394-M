/**
 * Tag Management View Component
 *
 * Inline view for managing global tag list.
 * Allows users to add new tags and delete existing ones via press-and-hold or double-click.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { selectAllTags, addTag, deleteTag } from '../../store/slices/tags.slice';
import { removeTagFromAllContacts } from '../../store/slices/contacts.slice';
import { useConfirmTagDelete } from '../../hooks/useConfirmTagDelete';
import { FormButtons } from '../FormButtons';

export interface TagManagementViewProps {
  onExit: () => void;
}

export function TagManagementView({ onExit }: TagManagementViewProps) {
  const dispatch = useDispatch();
  const tags = useSelector(selectAllTags);
  const { confirmDelete } = useConfirmTagDelete();

  const [newTagInput, setNewTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pressingTag, setPressingTag] = useState<string | null>(null);
  const [lastTapTime, setLastTapTime] = useState<Record<string, number>>({});

  // Animation values for each tag
  const animationRefs = useRef<Record<string, Animated.Value>>({});

  const normalizeTag = (input: string): string => {
    return input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
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

    return null;
  };

  const handleAddTag = () => {
    const error = validateTag(newTagInput);

    if (error) {
      setErrorMessage(error);
      return;
    }

    const normalized = normalizeTag(newTagInput);
    dispatch(addTag(normalized));

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
    setNewTagInput(text);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Get or create animation value for a tag
  const getAnimationValue = (tag: string): Animated.Value => {
    if (!animationRefs.current[tag]) {
      animationRefs.current[tag] = new Animated.Value(1);
    }
    return animationRefs.current[tag];
  };

  // Handle long press (500ms)
  const handlePillLongPress = (tag: string) => {
    handleDeleteTag(tag);
  };

  // Handle double-click detection
  const handlePillPress = (tag: string) => {
    const now = Date.now();
    const lastTap = lastTapTime[tag] || 0;

    if (now - lastTap < 300) {
      // Double-click detected
      handleDeleteTag(tag);
      setLastTapTime({ ...lastTapTime, [tag]: 0 });
    } else {
      // First tap, record timestamp
      setLastTapTime({ ...lastTapTime, [tag]: now });
    }
  };

  // Handle press-in for long-press animation
  const handlePressIn = (tag: string) => {
    setPressingTag(tag);
    const animValue = getAnimationValue(tag);
    Animated.timing(animValue, {
      toValue: 0.7,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Handle press-out to reset animation
  const handlePressOut = (tag: string) => {
    setPressingTag(null);
    const animValue = getAnimationValue(tag);
    Animated.timing(animValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <Text style={styles.title}>Manage Tags</Text>

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

        {/* Inline Error Message */}
        {errorMessage && (
          <View style={styles.errorContainer} testID="error-message">
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
        {tags.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome name="tags" size={32} color={colors.semantic.textTertiary} />
            <Text style={styles.emptyText}>No tags yet</Text>
            <Text style={styles.emptySubtext}>Add your first tag above</Text>
          </View>
        ) : (
          <View style={styles.pillGrid}>
            {tags.map((tag) => {
              const animValue = getAnimationValue(tag);
              return (
                <Animated.View
                  key={tag}
                  style={[
                    {
                      opacity: animValue,
                      transform: [
                        {
                          scale: animValue.interpolate({
                            inputRange: [0.7, 1],
                            outputRange: [0.95, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    style={styles.pill}
                    onPress={() => handlePillPress(tag)}
                    onLongPress={() => handlePillLongPress(tag)}
                    onPressIn={() => handlePressIn(tag)}
                    onPressOut={() => handlePressOut(tag)}
                    delayLongPress={500}
                    testID={`tag-pill-${tag}`}
                  >
                    <Text style={styles.pillText}>{tag}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>

      {/* Back Button */}
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
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: colors.semantic.surface,
  },
  pillText: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.primary[500],
  },
});
