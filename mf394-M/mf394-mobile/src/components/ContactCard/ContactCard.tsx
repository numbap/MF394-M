/**
 * ContactCard Component
 *
 * Displays a contact as an interactive card with photo, name, hint, and category.
 * Supports press-and-hold for editing.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radii, shadows } from '../../theme/theme';

export interface ContactCardProps {
  id: string;
  name: string;
  hint?: string;
  photo?: string;
  category: 'friends-family' | 'community' | 'work' | 'goals-hobbies' | 'miscellaneous';
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}

const CATEGORY_COLORS: Record<string, string> = {
  'friends-family': colors.primary[500],
  community: colors.secondary[500],
  work: colors.accent[500],
  'goals-hobbies': colors.copper[500],
  miscellaneous: colors.neutral.iron[500],
};

const CATEGORY_LABELS: Record<string, string> = {
  'friends-family': '👨‍👩‍👧',
  community: '👥',
  work: '💼',
  'goals-hobbies': '🎯',
  miscellaneous: '📌',
};

export function ContactCard({
  id,
  name,
  hint,
  photo,
  category,
  onPress,
  onLongPress,
  style,
}: ContactCardProps) {
  const categoryColor = CATEGORY_COLORS[category] || colors.primary[500];
  const categoryEmoji = CATEGORY_LABELS[category] || '📌';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.photoContainer}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.neutral.iron[100] }]}>
            <Text style={styles.placeholderText}>👤</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {hint && (
          <Text style={styles.hint} numberOfLines={1}>
            {hint}
          </Text>
        )}
      </View>

      <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
        <Text style={styles.categoryEmoji}>{categoryEmoji}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  pressed: {
    opacity: 0.8,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.semantic.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: colors.semantic.textSecondary,
  },
  categoryIcon: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 16,
  },
});
