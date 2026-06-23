/**
 * ContactList
 *
 * Presentational component: renders the FlatList of contacts
 * in card or gallery/thumbnail view, plus status bar and empty state.
 * No Redux, no navigation — pure rendering.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { ContactCard } from "../../components/ContactCard";
import { SummaryThumbnail } from "../../components/SummaryThumbnail";

interface Contact {
  _id: string;
  name: string;
  photo?: string;
  hint?: string;
  category: string;
  groups?: string[];
  created?: number;
  edited?: number;
}

interface ContactListProps {
  contacts: Contact[];
  isGalleryView: boolean;
  numColumns: number;
  filterHeader: React.ReactElement;
  counts: { filtered: number; total: number };
  onContactPress: (contactId: string) => void;
  onContactLongPress: (contactId: string) => void;
  hasCategories: boolean;
}

export function ContactList({
  contacts,
  isGalleryView,
  numColumns,
  filterHeader,
  counts,
  onContactPress,
  onContactLongPress,
  hasCategories,
}: ContactListProps) {
  const emptyState = hasCategories ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No contacts found</Text>
    </View>
  ) : null;

  const statusBar = hasCategories ? (
    <View style={styles.statusBar}>
      <Text style={styles.statusText}>
        {counts.filtered} of {counts.total}
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width:
                counts.total > 0
                  ? `${(counts.filtered / counts.total) * 100}%`
                  : "0%",
            },
          ]}
        />
      </View>
    </View>
  ) : null;

  return (
    <FlatList
      key={isGalleryView ? `gallery-${numColumns}` : `cards-${numColumns}`}
      data={hasCategories ? contacts : []}
      keyExtractor={(item) => item._id}
      numColumns={numColumns}
      removeClippedSubviews={Platform.OS !== "android"}
      columnWrapperStyle={
        numColumns > 1
          ? isGalleryView
            ? styles.galleryRow
            : styles.cardRow
          : undefined
      }
      renderItem={({ item: contact }) => (
        <Pressable
          onPress={() => onContactPress(contact._id)}
          onLongPress={() => onContactLongPress(contact._id)}
          delayLongPress={500}
          style={({ pressed }) => [
            isGalleryView ? styles.thumbnailItem : styles.cardItem,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          {isGalleryView ? (
            <SummaryThumbnail
              id={contact._id}
              name={contact.name}
              photo={contact.photo}
              hint={contact.hint}
            />
          ) : (
            <ContactCard contact={contact} />
          )}
        </Pressable>
      )}
      ListHeaderComponent={filterHeader}
      ListEmptyComponent={emptyState}
      ListFooterComponent={
        hasCategories ? (
          <View style={styles.footerSpacer}>{statusBar}</View>
        ) : null
      }
      contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 0,
  },
  galleryRow: {
    gap: spacing.xxs,
    justifyContent: "center",
  },
  cardRow: {
    gap: spacing.sm,
    justifyContent: "center",
  },
  thumbnailItem: {
    margin: spacing.xs,
  },
  cardItem: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.textSecondary,
    fontWeight: "500",
  },
  footerSpacer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  statusBar: {
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.surface,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textSecondary,
    fontWeight: "500",
  },
  progressTrack: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.iron[100],
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primary[500],
  },
});
