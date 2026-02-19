/**
 * FilterContainer Integration Tests
 *
 * Tests FilterContainer with real filter components to ensure
 * the 360px constraint works with actual usage in ListingScreen.
 */

import React, { useState } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { FilterContainer } from "./FilterContainer";
import { CategoryTagFilter } from "../CategoryTagFilter";
import { CATEGORIES } from "../../constants";
import { colors, spacing, radii, typography } from "../../theme/theme";

// Mock filter interface similar to ListingScreen
const MockFilterInterface = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const availableTags = ["Tag1", "Tag2", "Tag3"];

  const handleCategoryPress = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleCategoryLongPress = () => {
    setSelectedCategories(
      selectedCategories.length >= CATEGORIES.length / 2
        ? []
        : CATEGORIES.map((c) => c.value)
    );
  };

  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <FilterContainer testID="mock-filter">
      <CategoryTagFilter
        categories={CATEGORIES}
        selectedCategories={selectedCategories}
        onCategoryPress={handleCategoryPress}
        onCategoryLongPress={handleCategoryLongPress}
      />

      {selectedCategories.length > 0 && availableTags.length > 0 && (
        <View style={styles.tagsSection}>
          <Text style={styles.tagsLabel}>Tags</Text>
          <View style={styles.tagsContainer}>
            {availableTags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => handleTagPress(tag)}
                testID={`tag-${tag}`}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.tagButtonSelected,
                ]}
              >
                <Text>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} testID="add-button">
          <Text>Add</Text>
        </Pressable>
        <Pressable style={styles.actionButton} testID="party-button">
          <Text>Party</Text>
        </Pressable>
      </View>
    </FilterContainer>
  );
};

const styles = StyleSheet.create({
  tagsSection: {
    marginBottom: spacing.lg,
  },
  tagsLabel: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    backgroundColor: colors.semantic.surface,
  },
  tagButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500],
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: radii.md,
    alignItems: "center",
  },
});

describe("FilterContainer Integration", () => {
  describe("With CategoryTagFilter", () => {
    it("renders CategoryTagFilter within constraints", () => {
      const { getByTestId, getByText } = render(<MockFilterInterface />);

      const container = getByTestId("mock-filter");
      expect(container).toBeTruthy();

      // Verify CategoryTagFilter is rendered
      expect(getByText("Select a Category")).toBeTruthy();
    });

    it("maintains constraint when categories are selected", () => {
      const { getByTestId } = render(<MockFilterInterface />);

      const categoryButton = getByTestId("category-button-friends-family");
      fireEvent.press(categoryButton);

      const container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: 360,
            alignSelf: "center",
            width: "100%",
          }),
        ])
      );
    });

    it("maintains constraint when tags section appears", () => {
      const { getByTestId, getByText } = render(<MockFilterInterface />);

      // Select a category to show tags
      const categoryButton = getByTestId("category-button-friends-family");
      fireEvent.press(categoryButton);

      // Tags section should appear
      expect(getByText("Tags")).toBeTruthy();
      expect(getByTestId("tag-Tag1")).toBeTruthy();

      const container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: 360,
          }),
        ])
      );
    });
  });

  describe("With Action Buttons", () => {
    it("renders action buttons within constraints", () => {
      const { getByTestId } = render(<MockFilterInterface />);

      expect(getByTestId("add-button")).toBeTruthy();
      expect(getByTestId("party-button")).toBeTruthy();

      const container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: 360,
          }),
        ])
      );
    });

    it("action buttons are clickable within container", () => {
      const { getByTestId } = render(<MockFilterInterface />);

      const addButton = getByTestId("add-button");
      fireEvent.press(addButton);

      // Should not throw and container should maintain constraints
      const container = getByTestId("mock-filter");
      expect(container).toBeTruthy();
    });
  });

  describe("Full Filter Interface", () => {
    it("renders complete filter interface with all elements", () => {
      const { getByTestId, getByText } = render(<MockFilterInterface />);

      // CategoryTagFilter
      expect(getByText("Select a Category")).toBeTruthy();

      // Action buttons
      expect(getByTestId("add-button")).toBeTruthy();
      expect(getByTestId("party-button")).toBeTruthy();

      // Container
      const container = getByTestId("mock-filter");
      expect(container).toBeTruthy();
    });

    it("handles full user interaction flow within constraints", () => {
      const { getByTestId, getByText } = render(<MockFilterInterface />);

      // Select a category
      fireEvent.press(getByTestId("category-button-friends-family"));
      expect(getByText("Friends & Family")).toBeTruthy();

      // Tags should appear
      expect(getByText("Tags")).toBeTruthy();

      // Select a tag
      fireEvent.press(getByTestId("tag-Tag1"));

      // Select another category
      fireEvent.press(getByTestId("category-button-work"));

      // Container should maintain constraints throughout
      const container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: 360,
            alignSelf: "center",
            width: "100%",
          }),
        ])
      );
    });

    it("matches snapshot of full filter interface", () => {
      const { toJSON } = render(<MockFilterInterface />);
      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with categories selected", () => {
      const { getByTestId, toJSON } = render(<MockFilterInterface />);

      fireEvent.press(getByTestId("category-button-friends-family"));
      fireEvent.press(getByTestId("category-button-work"));

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe("Layout Behavior", () => {
    it("container width is 100% for small screens", () => {
      const { getByTestId } = render(<MockFilterInterface />);

      const container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: "100%",
          }),
        ])
      );
    });

    it("container is centered via alignSelf", () => {
      const { getByTestId } = render(<MockFilterInterface />);

      const container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            alignSelf: "center",
          }),
        ])
      );
    });

    it("maintains maxWidth throughout state changes", () => {
      const { getByTestId } = render(<MockFilterInterface />);

      // Initial state
      let container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ maxWidth: 360 }),
        ])
      );

      // After selecting category
      fireEvent.press(getByTestId("category-button-friends-family"));
      container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ maxWidth: 360 }),
        ])
      );

      // After selecting tag
      fireEvent.press(getByTestId("tag-Tag1"));
      container = getByTestId("mock-filter");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ maxWidth: 360 }),
        ])
      );
    });
  });
});
