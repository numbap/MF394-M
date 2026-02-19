import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { COLORS, SPACING } from "../utils/constants";

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
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  chip: {
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.LG,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    marginRight: SPACING.SM,
  },
  chipSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.TEXT,
  },
  chipTextSelected: {
    color: "#fff",
  },
});
