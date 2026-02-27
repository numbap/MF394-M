/**
 * ContactCard Component
 *
 * Displays a contact as an interactive card with photo, name, hint, and category.
 * Supports press-and-hold for editing.
 * Shows category icon in a yellow square and optional info icon in a blue square.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, shadows } from "../../theme/theme";
import type { Contact } from "../../store/api/contacts.api";

export interface ContactCardProps {
  contact: Contact;
  style?: ViewStyle;
}

const CATEGORY_ICONS: Record<string, string> = {
  "friends-family": "users",
  community: "globe",
  work: "briefcase",
  "goals-hobbies": "trophy",
  miscellaneous: "bookmark",
};

export function ContactCard({ contact, style }: ContactCardProps) {
  const { name, hint, photo, category, summary, groups } = contact;
  const [showSummary, setShowSummary] = useState(false);

  const categoryIcon = CATEGORY_ICONS[category] || "bookmark";

  const hasSummary = !!summary;
  const tags = groups || [];
  const displayTags = tags.slice(0, 2);
  const extraTagsCount = tags.length > 2 ? tags.length - 2 : 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.photoContainer}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.neutral.iron[100] }]}>
            <FontAwesome name={"user-circle" as any} size={48} color={colors.semantic.textSecondary} />
          </View>
        )}
      </View>

      {/* Contact Card bottom section */}
      <View style={[styles.bottomSection, showSummary && styles.bottomSectionActive]}>
        {/* Category icon - top right corner */}
        <View style={[styles.categoryIconBox, { backgroundColor: colors.secondary[500] }]}>
          <FontAwesome name={categoryIcon as any} size={18} color={colors.semantic.text} />
        </View>

        {/* Info icon - bottom right corner (only if summary exists) */}
        {hasSummary && (
          <TouchableOpacity
            style={[styles.infoIconBox, { backgroundColor: colors.semantic.info }]}
            onPress={() => setShowSummary(!showSummary)}
          >
            <FontAwesome name={"info" as any} size={18} color="white" />
          </TouchableOpacity>
        )}

        {/* Content area with proper right margin */}
        <View style={styles.contentArea}>
          {showSummary && hasSummary ? (
            <Text style={styles.summary} numberOfLines={3}>
              {summary}
            </Text>
          ) : (
            <>
              <Text style={styles.name} numberOfLines={2}>
                {name}
              </Text>
              {hint && (
                <Text style={styles.hint} numberOfLines={1}>
                  {hint}
                </Text>
              )}
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {displayTags.map((tag) => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {tag}
                      </Text>
                    </View>
                  ))}
                  {extraTagsCount > 0 && (
                    <View style={styles.tagPill}>
                      <Text style={styles.tagText}>+{extraTagsCount}</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: "hidden",
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSection: {
    position: "relative",
    height: 100,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingLeft: spacing.md,
    paddingRight: spacing.md + 36, // Margin to prevent icon overlap
    justifyContent: "center",
    backgroundColor: colors.semantic.surface,
  },
  bottomSectionActive: {
    backgroundColor: colors.secondary[100],
  },
  contentArea: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.semantic.text,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: 12,
    color: colors.semantic.textSecondary,
  },
  summary: {
    fontSize: 12,
    color: colors.semantic.text,
    lineHeight: 18,
  },
  categoryIconBox: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 25,
    height: 25,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  infoIconBox: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 25,
    height: 25,
    borderRadius: radii.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tagPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  tagText: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.primary[700],
  },
});
