/**
 * FormButtons Component Tests
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { FormButtons } from "../../src/components/FormButtons";

describe("FormButtons", () => {
  const mockPrimaryPress = jest.fn();
  const mockDeletePress = jest.fn();
  const mockCancelPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders only cancel button when no optional buttons provided", () => {
    const { getByText, queryByText } = render(
      <FormButtons
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    expect(getByText("Cancel")).toBeTruthy();
    expect(queryByText("Save")).toBeNull();
    expect(queryByText("Delete")).toBeNull();
  });

  it("renders all three buttons when all provided", () => {
    const { getByText } = render(
      <FormButtons
        primaryButton={{ label: "Save", icon: "save", onPress: mockPrimaryPress }}
        deleteButton={{ label: "Delete", icon: "trash", onPress: mockDeletePress }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Delete")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("calls correct handler when primary button pressed", () => {
    const { getByText } = render(
      <FormButtons
        primaryButton={{ label: "Save", onPress: mockPrimaryPress }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    fireEvent.press(getByText("Save"));
    expect(mockPrimaryPress).toHaveBeenCalledTimes(1);
  });

  it("calls correct handler when delete button pressed", () => {
    const { getByText } = render(
      <FormButtons
        deleteButton={{ label: "Delete", onPress: mockDeletePress }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    fireEvent.press(getByText("Delete"));
    expect(mockDeletePress).toHaveBeenCalledTimes(1);
  });

  it("calls correct handler when cancel button pressed", () => {
    const { getByText } = render(
      <FormButtons
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    fireEvent.press(getByText("Cancel"));
    expect(mockCancelPress).toHaveBeenCalledTimes(1);
  });

  it("shows loading indicator on primary button when loading", () => {
    const { queryByText } = render(
      <FormButtons
        primaryButton={{ label: "Save", onPress: mockPrimaryPress, isLoading: true }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    // Label should not be visible during loading
    expect(queryByText("Save")).toBeNull();
  });

  it("disables all buttons when any button is loading", () => {
    const { getByText } = render(
      <FormButtons
        primaryButton={{ label: "Save", onPress: mockPrimaryPress, isLoading: true }}
        deleteButton={{ label: "Delete", onPress: mockDeletePress }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    // Try to press delete button (should be disabled)
    fireEvent.press(getByText("Delete"));
    expect(mockDeletePress).not.toHaveBeenCalled();

    // Try to press cancel button (should be disabled)
    fireEvent.press(getByText("Cancel"));
    expect(mockCancelPress).not.toHaveBeenCalled();
  });

  it("disables primary button when disabled prop is true", () => {
    const { getByText } = render(
      <FormButtons
        primaryButton={{ label: "Save", onPress: mockPrimaryPress, disabled: true }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    // Try to press primary button (should be disabled)
    fireEvent.press(getByText("Save"));
    expect(mockPrimaryPress).not.toHaveBeenCalled();

    // Cancel button should still work
    fireEvent.press(getByText("Cancel"));
    expect(mockCancelPress).toHaveBeenCalledTimes(1);
  });

  it("disables delete button when disabled prop is true", () => {
    const { getByText } = render(
      <FormButtons
        deleteButton={{ label: "Delete", onPress: mockDeletePress, disabled: true }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    // Try to press delete button (should be disabled)
    fireEvent.press(getByText("Delete"));
    expect(mockDeletePress).not.toHaveBeenCalled();

    // Cancel button should still work
    fireEvent.press(getByText("Cancel"));
    expect(mockCancelPress).toHaveBeenCalledTimes(1);
  });

  it("supports custom labels for all buttons", () => {
    const { getByText } = render(
      <FormButtons
        primaryButton={{ label: "Add Contact", icon: "plus", onPress: mockPrimaryPress }}
        deleteButton={{ label: "Remove", icon: "trash", onPress: mockDeletePress }}
        cancelButton={{ label: "Go Back", icon: "arrow-left", onPress: mockCancelPress }}
      />
    );

    expect(getByText("Add Contact")).toBeTruthy();
    expect(getByText("Remove")).toBeTruthy();
    expect(getByText("Go Back")).toBeTruthy();
  });

  it("renders buttons without icons", () => {
    const { getByText } = render(
      <FormButtons
        primaryButton={{ label: "Save", onPress: mockPrimaryPress }}
        cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
      />
    );

    expect(getByText("Save")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  describe("Snapshots", () => {
    it("matches snapshot with only cancel button", () => {
      const { toJSON } = render(
        <FormButtons
          cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with primary and cancel buttons", () => {
      const { toJSON } = render(
        <FormButtons
          primaryButton={{ label: "Add Contact", icon: "plus", onPress: mockPrimaryPress }}
          cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with all three buttons", () => {
      const { toJSON } = render(
        <FormButtons
          primaryButton={{ label: "Save", icon: "save", onPress: mockPrimaryPress }}
          deleteButton={{ label: "Delete", icon: "trash", onPress: mockDeletePress }}
          cancelButton={{ label: "Go Back", icon: "arrow-left", onPress: mockCancelPress }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with delete button icon only", () => {
      const { toJSON } = render(
        <FormButtons
          primaryButton={{ label: "Save", icon: "save", onPress: mockPrimaryPress }}
          deleteButton={{ label: "", icon: "trash", onPress: mockDeletePress }}
          cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with loading state", () => {
      const { toJSON } = render(
        <FormButtons
          primaryButton={{ label: "Save", icon: "save", onPress: mockPrimaryPress, isLoading: true }}
          deleteButton={{ label: "Delete", icon: "trash", onPress: mockDeletePress }}
          cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with disabled primary button", () => {
      const { toJSON } = render(
        <FormButtons
          primaryButton={{ label: "Add Contact", icon: "save", onPress: mockPrimaryPress, disabled: true }}
          cancelButton={{ label: "Cancel", onPress: mockCancelPress }}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
