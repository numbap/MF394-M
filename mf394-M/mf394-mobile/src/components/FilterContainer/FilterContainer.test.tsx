/**
 * FilterContainer Tests
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { Text, View, TouchableOpacity } from "react-native";
import { FilterContainer } from "./FilterContainer";

describe("FilterContainer", () => {
  describe("Basic Rendering", () => {
    it("renders children correctly", () => {
      const { getByText } = render(
        <FilterContainer>
          <Text>Test Content</Text>
        </FilterContainer>
      );

      expect(getByText("Test Content")).toBeTruthy();
    });

    it("renders multiple children", () => {
      const { getByText } = render(
        <FilterContainer>
          <Text>First Child</Text>
          <Text>Second Child</Text>
          <Text>Third Child</Text>
        </FilterContainer>
      );

      expect(getByText("First Child")).toBeTruthy();
      expect(getByText("Second Child")).toBeTruthy();
      expect(getByText("Third Child")).toBeTruthy();
    });

    it("renders complex nested children", () => {
      const { getByText, getByTestId } = render(
        <FilterContainer>
          <View testID="nested-view">
            <Text>Header</Text>
            <View>
              <TouchableOpacity>
                <Text>Button</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FilterContainer>
      );

      expect(getByTestId("nested-view")).toBeTruthy();
      expect(getByText("Header")).toBeTruthy();
      expect(getByText("Button")).toBeTruthy();
    });

    it("renders with no children", () => {
      const { getByTestId } = render(
        <FilterContainer testID="empty-container" />
      );

      expect(getByTestId("empty-container")).toBeTruthy();
    });
  });

  describe("Style Constraints", () => {
    it("applies correct max width constraint", () => {
      const { getByTestId } = render(
        <FilterContainer testID="filter-container">
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
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

    it("applies width of 100%", () => {
      const { getByTestId } = render(
        <FilterContainer testID="filter-container">
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: "100%",
          }),
        ])
      );
    });

    it("applies alignSelf center for centering on large screens", () => {
      const { getByTestId } = render(
        <FilterContainer testID="filter-container">
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            alignSelf: "center",
          }),
        ])
      );
    });

    it("accepts custom style prop", () => {
      const customStyle = { paddingTop: 20 };
      const { getByTestId } = render(
        <FilterContainer testID="filter-container" style={customStyle}>
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle),
        ])
      );
    });

    it("merges custom styles without overriding constraints", () => {
      const customStyle = { backgroundColor: "red", padding: 10 };
      const { getByTestId } = render(
        <FilterContainer testID="filter-container" style={customStyle}>
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: 360,
            alignSelf: "center",
            width: "100%",
          }),
          expect.objectContaining(customStyle),
        ])
      );
    });

    it("accepts array of custom styles", () => {
      const customStyles = [{ paddingTop: 10 }, { marginBottom: 20 }];
      const { getByTestId } = render(
        <FilterContainer testID="filter-container" style={customStyles}>
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.style).toBeTruthy();
    });
  });

  describe("Props Forwarding", () => {
    it("forwards additional props", () => {
      const { getByTestId } = render(
        <FilterContainer testID="custom-test-id" accessibilityLabel="Filter Section">
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("custom-test-id");
      expect(container.props.accessibilityLabel).toBe("Filter Section");
    });

    it("forwards accessibility props", () => {
      const { getByTestId } = render(
        <FilterContainer
          testID="filter-container"
          accessibilityRole="region"
          accessibilityHint="Filter controls"
        >
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.accessibilityRole).toBe("region");
      expect(container.props.accessibilityHint).toBe("Filter controls");
    });

    it("forwards onLayout prop", () => {
      const onLayout = jest.fn();
      const { getByTestId } = render(
        <FilterContainer testID="filter-container" onLayout={onLayout}>
          <Text>Content</Text>
        </FilterContainer>
      );

      const container = getByTestId("filter-container");
      expect(container.props.onLayout).toBe(onLayout);
    });
  });

  describe("Snapshots", () => {
    it("matches snapshot with basic content", () => {
      const { toJSON } = render(
        <FilterContainer>
          <Text>Test Content</Text>
        </FilterContainer>
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with multiple children", () => {
      const { toJSON } = render(
        <FilterContainer>
          <View>
            <Text>Header</Text>
          </View>
          <View>
            <Text>Body</Text>
          </View>
          <View>
            <Text>Footer</Text>
          </View>
        </FilterContainer>
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with custom styles", () => {
      const { toJSON } = render(
        <FilterContainer style={{ backgroundColor: "#f0f0f0", padding: 16 }}>
          <Text>Styled Content</Text>
        </FilterContainer>
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
