import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { colors, spacing } from "../theme/theme";

export default function TagFilter({ tags, selectedTags, onTagSelect }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag._id}
          style={[
            styles.chip,
            selectedTags.includes(tag._id) && styles.chipSelected,
          ]}
          onPress={() => onTagSelect(tag._id)}
        >
          <Text
            style={[
              styles.chipText,
              selectedTags.includes(tag._id) && styles.chipTextSelected,
            ]}
          >
            {tag.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.semantic.surface,
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary[500],
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.semantic.text,
  },
  chipTextSelected: {
    color: "#fff",
  },
});
