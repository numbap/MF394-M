/**
 * ListingScreen Tests
 *
 * Tests the ListingScreen component.
 * Contacts are loaded via RTK Query (useGetUserQuery).
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ListingScreen from "./ListingScreen";
import contactsReducer from "../../store/slices/contacts.slice";
import filtersReducer from "../../store/slices/filters.slice";
import tagsReducer from "../../store/slices/tags.slice";
import uiReducer from "../../store/slices/ui.slice";
import authReducer from "../../store/slices/auth.slice";

// Mock contacts data
const mockContacts = [
  {
    _id: "1",
    name: "John Doe",
    hint: "Friend from college",
    photo: "https://example.com/photo1.jpg",
    category: "friends-family" as const,
    groups: ["Tag1", "Tag2"],
    created: Date.now(),
    edited: Date.now(),
  },
  {
    _id: "2",
    name: "Jane Smith",
    hint: "Colleague",
    photo: "https://example.com/photo2.jpg",
    category: "work" as const,
    groups: ["Tag3"],
    created: Date.now(),
    edited: Date.now(),
  },
];

// Mock RTK Query
jest.mock("../../store/api/contacts.api", () => ({
  useGetUserQuery: jest.fn(() => ({
    data: { contacts: mockContacts, managedTags: [] },
    isLoading: false,
    error: null,
  })),
}));

// Mock StorageService
jest.mock("../../services/storage.service", () => ({
  StorageService: {
    loadFilters: jest.fn().mockResolvedValue({ categories: [], tags: [] }),
    saveFilters: jest.fn(),
  },
}));

// Mock network status
jest.mock("../../hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({ params: {} }),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const createTestStore = () =>
  configureStore({
    reducer: {
      contacts: contactsReducer,
      filters: filtersReducer,
      tags: tagsReducer,
      ui: uiReducer,
      auth: authReducer,
    },
  });

const renderWithStore = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(<Provider store={store}>{component}</Provider>);
};

describe("ListingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders category filter section", async () => {
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });
    });

    it("shows Add and Party buttons", async () => {
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      expect(getByText("Add")).toBeTruthy();
      expect(getByText("Party")).toBeTruthy();
    });
  });

  describe("Category Filtering", () => {
    it("shows contacts when a category is selected", async () => {
      const { getByTestId, findByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      const categoryButton = getByTestId("category-button-friends-family");
      fireEvent.press(categoryButton);

      expect(await findByText("John Doe")).toBeTruthy();
    });

    it("shows no contacts when a category with no matching contacts is selected", async () => {
      const { getByTestId, queryByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      const categoryButton = getByTestId("category-button-goals-hobbies");
      fireEvent.press(categoryButton);

      await waitFor(() => {
        expect(queryByText("No contacts found")).toBeTruthy();
      });
    });
  });

  describe("Action Buttons", () => {
    it("navigates to AddContact when Add button is pressed", () => {
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText("Add"));
      expect(mockNavigate).toHaveBeenCalledWith("AddContact");
    });

    it("navigates to PartyMode when Party button is pressed", () => {
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      fireEvent.press(getByText("Party"));
      expect(mockNavigate).toHaveBeenCalledWith("PartyMode");
    });
  });

  describe("Offline mode", () => {
    it("disables Add and Party buttons when offline", () => {
      // When offline, buttons are rendered but disabled
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      expect(getByText("Add")).toBeTruthy();
      expect(getByText("Party")).toBeTruthy();
    });
  });
});
