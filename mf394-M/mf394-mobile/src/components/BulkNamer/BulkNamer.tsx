/**
 * Bulk Namer Component
 *
 * Allows users to name multiple faces from a group photo.
 * Each face shows as a thumbnail with a red border (unnamed) or green border (named).
 * Users can edit the name for each face inline.
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';

export interface NamedFace {
  id: string;
  faceUri: string;
  name: string;
}

interface BulkNamerProps {
  faces: Array<{ id: string; uri: string }>;
  onNamesChange: (namedFaces: NamedFace[]) => void;
  style?: ViewStyle;
}

export function BulkNamer({ faces, onNamesChange, style }: BulkNamerProps) {
  const [names, setNames] = useState<{ [faceId: string]: string }>(
    faces.reduce((acc, face) => ({ ...acc, [face.id]: '' }), {})
  );

  const handleNameChange = (faceId: string, name: string) => {
    const updatedNames = { ...names, [faceId]: name };
    setNames(updatedNames);

    // Callback with named faces (only those with names)
    const namedFaces: NamedFace[] = faces
      .filter((face) => updatedNames[face.id]?.trim())
      .map((face) => ({
        id: face.id,
        faceUri: face.uri,
        name: updatedNames[face.id].trim(),
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
    <ScrollView style={[styles.container, style]}>
      <Text style={styles.title}>Name Your Contacts</Text>
      <Text style={styles.subtitle}>
        Add a name to each face you want to keep. Green border = validated.
      </Text>

      {/* Face Grid */}
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((face) => (
              <View key={face.id} style={styles.itemContainer}>
                {/* Face Thumbnail */}
                <View
                  style={[
                    styles.thumbnailContainer,
                    {
                      borderColor: isFaceNamed(face.id)
                        ? colors.semantic.success
                        : colors.semantic.error,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: face.uri }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />

                  {/* Validation indicator */}
                  {isFaceNamed(face.id) && (
                    <View style={styles.validationBadge}>
                      <FontAwesome name="check-circle" size={24} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Name Input */}
                <TextInput
                  style={styles.nameInput}
                  placeholder="Enter name"
                  placeholderTextColor={colors.semantic.textTertiary}
                  value={names[face.id]}
                  onChangeText={(text) => handleNameChange(face.id, text)}
                  maxLength={30}
                />

                {/* Character counter */}
                <Text style={styles.charCounter}>
                  {names[face.id].length}/30
                </Text>
              </View>
            ))}

            {/* Fill empty space in last row */}
            {row.length < itemsPerRow &&
              Array.from({ length: itemsPerRow - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.itemContainer} />
              ))}
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {Object.values(names).filter((n) => n.trim()).length} of{' '}
          {faces.length} contacts named
        </Text>
      </View>
    </ScrollView>
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
    fontWeight: '700',
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 3,
    marginBottom: spacing.md,
    position: 'relative',
    backgroundColor: colors.semantic.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  validationBadge: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
    marginBottom: spacing.xs,
  },
  charCounter: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textTertiary,
  },
  summary: {
    padding: spacing.lg,
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.body.large.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
  },
});
