/**
 * Bulk Namer Row Component
 *
 * Renders a single row of faces in the bulk namer grid.
 * Each face shows a thumbnail with a color-coded border (red: unnamed, green: named)
 * and a text input for the contact name.
 */

import React from "react";
import { View, Image, Text, StyleSheet, TextInput } from "react-native";
import { colors, spacing, radii, typography } from "../../theme/theme";

interface BulkNamerRowProps {
  row: Array<{ id: string; uri: string }>;
  names: { [faceId: string]: string };
  onNameChange: (faceId: string, name: string) => void;
  isFaceNamed: (faceId: string) => boolean;
  itemsPerRow: number;
}

export function BulkNamerRow({
  row,
  names,
  onNameChange,
  isFaceNamed,
  itemsPerRow,
}: BulkNamerRowProps) {
  return (
    <View style={styles.row}>
      {row.map((face) => (
        <View key={face.id} style={styles.itemContainer}>
          {/* Face Thumbnail */}
          <View
            style={[
              styles.thumbnailContainer,
              {
                borderColor: isFaceNamed(face.id) ? colors.semantic.success : colors.semantic.error,
              },
            ]}
          >
            <Image source={{ uri: face.uri }} style={styles.thumbnail} resizeMode="cover" />
          </View>

          {/* Name Input */}
          <TextInput
            style={styles.nameInput}
            placeholder="Name"
            placeholderTextColor={colors.semantic.textTertiary}
            value={names[face.id]}
            onChangeText={(text) => onNameChange(face.id, text)}
            maxLength={30}
          />
        </View>
      ))}

      {/* Fill empty space in last row */}
      {row.length < itemsPerRow &&
        Array.from({ length: itemsPerRow - row.length }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.itemContainer} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  itemContainer: {
    flex: 1,
    alignItems: "center",
  },
  thumbnailContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 3,
    marginBottom: spacing.md,
    backgroundColor: colors.semantic.surface,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  nameInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
    backgroundColor: colors.semantic.inputBackground,
    marginBottom: spacing.xs,
  },
  charCounter: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textTertiary,
  },
});
