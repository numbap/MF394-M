/**
 * ExtractResultsList
 *
 * Displays extracted people from a screenshot scan with:
 * - Face region boxes overlaid on the original screenshot
 * - Name, title, organization for each person
 * - Checkboxes to select/deselect people for import
 */

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";
import type { ExtractedPerson } from "../../store/api/extract.api";

interface ExtractResultsListProps {
  people: ExtractedPerson[];
  selectedIndices: Set<number>;
  imageUri: string | null;
  onTogglePerson: (index: number) => void;
}

export function ExtractResultsList({
  people,
  selectedIndices,
  imageUri,
  onTogglePerson,
}: ExtractResultsListProps) {
  return (
    <View style={styles.container}>
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.screenshot} resizeMode="contain" />
          {people.map((person, index) =>
            person.faceRegion ? (
              <View
                key={index}
                style={[
                  styles.faceBox,
                  {
                    left: `${person.faceRegion.x * 100}%`,
                    top: `${person.faceRegion.y * 100}%`,
                    width: `${person.faceRegion.width * 100}%`,
                    height: `${person.faceRegion.height * 100}%`,
                  },
                  selectedIndices.has(index)
                    ? styles.faceBoxSelected
                    : styles.faceBoxDeselected,
                ]}
              />
            ) : null
          )}
        </View>
      )}

      <Text style={styles.heading}>
        Found {people.length} {people.length === 1 ? "person" : "people"}
      </Text>

      {people.map((person, index) => (
        <TouchableOpacity
          key={index}
          style={styles.personRow}
          onPress={() => onTogglePerson(index)}
          activeOpacity={0.7}
        >
          <View style={styles.checkbox}>
            {selectedIndices.has(index) ? (
              <FontAwesome name="check-square" size={22} color={colors.primary[500]} />
            ) : (
              <FontAwesome name="square-o" size={22} color={colors.semantic.textTertiary} />
            )}
          </View>
          <View style={styles.personInfo}>
            <Text style={styles.personName}>{person.name}</Text>
            {person.title && (
              <Text style={styles.personDetail}>{person.title}</Text>
            )}
            {person.organization && (
              <Text style={styles.personDetail}>{person.organization}</Text>
            )}
            {!person.faceRegion && (
              <Text style={styles.noFaceLabel}>No face detected</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  imageContainer: {
    position: "relative",
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.semantic.surface,
  },
  screenshot: {
    width: "100%",
    height: 250,
  },
  faceBox: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: radii.xs,
  },
  faceBoxSelected: {
    borderColor: colors.semantic.success,
  },
  faceBoxDeselected: {
    borderColor: colors.semantic.textTertiary,
    opacity: 0.5,
  },
  heading: {
    fontSize: typography.title.small.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
    paddingVertical: spacing.sm,
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    gap: spacing.md,
  },
  checkbox: {
    width: 28,
    alignItems: "center",
  },
  personInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  personName: {
    fontSize: typography.body.large.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
  },
  personDetail: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textSecondary,
  },
  noFaceLabel: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textTertiary,
    fontStyle: "italic",
  },
});
