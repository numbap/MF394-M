/**
 * Bulk Namer Component
 *
 * Allows users to name multiple faces from a group photo.
 * Each face shows as a thumbnail with a red border (unnamed) or green border (named).
 * Users can edit the name for each face inline.
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ViewStyle } from "react-native";
import { colors, spacing, typography } from "../../theme/theme";
import { BulkNamerRow } from "./BulkNamerRow";

export interface NamedFace {
  id: string;
  faceUri: string;
  name: string;
}

interface BulkNamerProps {
  faces: Array<{ id: string; uri: string }>;
  onNamesChange: (namedFaces: NamedFace[]) => void;
  initialNames?: NamedFace[];
  style?: ViewStyle;
}

export function BulkNamer({ faces, onNamesChange, initialNames, style }: BulkNamerProps) {
  const [names, setNames] = useState<{ [faceId: string]: string }>(
    faces.reduce((acc, face) => ({ ...acc, [face.id]: "" }), {})
  );

  // Sync with initialNames when they change (e.g., navigating back)
  useEffect(() => {
    if (initialNames && initialNames.length > 0) {
      const initialNamesMap = initialNames.reduce(
        (acc, face) => ({ ...acc, [face.id]: face.name }),
        {} as { [faceId: string]: string }
      );
      setNames((prev) => ({ ...prev, ...initialNamesMap }));
    }
  }, [initialNames]);

  const handleNameChange = (faceId: string, name: string) => {
    const updatedNames = { ...names, [faceId]: name };
    setNames(updatedNames);

    // Callback with named faces (only those with names)
    const namedFaces: NamedFace[] = faces
      .filter((face) => updatedNames[face.id]?.trim())
      .map((face) => ({
        id: face.id,
        faceUri: face.uri,
        name: updatedNames[face.id],
      }));

    onNamesChange(namedFaces);
  };

  const isFaceNamed = (faceId: string) => !!names[faceId]?.trim();

  // Calculate grid layout (2 columns on mobile, 3+ on larger screens)
  const itemsPerRow = 2;
  const rows = [];
  for (let i = 0; i < faces.length; i += itemsPerRow) {
    rows.push(faces.slice(i, i + itemsPerRow));
  }

  return (
    // <ScrollView style={[styles.container, style]}>
    // {/* Face Grid */}
    <View style={styles.gridContainer}>
      {rows.map((row, rowIndex) => (
        <BulkNamerRow
          key={rowIndex}
          row={row}
          names={names}
          onNameChange={handleNameChange}
          isFaceNamed={isFaceNamed}
          itemsPerRow={itemsPerRow}
        />
      ))}
    </View>
    // </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.semantic.background,
  },
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.lg,
  },
  gridContainer: {
    marginBottom: spacing.xl,
  },
  summary: {
    padding: spacing.lg,
    backgroundColor: colors.semantic.surface,
    borderRadius: 8,
    alignItems: "center",
  },
  summaryText: {
    fontSize: typography.body.large.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
  },
});
