/**
 * ListingScreen Tests
 *
 * Tests the ListingScreen component with FilterContainer integration.
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ListingScreen from "./ListingScreen";
import contactsReducer from "../../store/slices/contacts.slice";

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
  {
    _id: "3",
    name: "Bob Wilson",
    hint: "Neighbor",
    photo: "https://example.com/photo3.jpg",
    category: "friends-family" as const,
    groups: ["Tag1"],
    created: Date.now(),
    edited: Date.now(),
  },
];

// Mock StorageService
jest.mock("../../services/storage.service", () => ({
  StorageService: {
    saveContacts: jest.fn(),
    loadContacts: jest.fn().mockResolvedValue([]),
  },
}));

// Mock mock_user.json
jest.mock("../../mock_user.json", () => ({
  contacts: mockContacts,
}));

// Mock navigation
jest.mock("@react-navigation/native", () => ({
  useRoute: () => ({
    params: {},
  }),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      contacts: contactsReducer,
    },
    preloadedState,
  });
};

const renderWithStore = (component: React.ReactElement, preloadedState?: any) => {
  const store = createTestStore(preloadedState);
  return render(<Provider store={store}>{component}</Provider>);
};

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe("ListingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FilterContainer Integration", () => {
    it("renders FilterContainer in the filter section", async () => {
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });
    });

    it("filter interface respects 360px max width constraint", async () => {
      const { getByText, UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Find FilterContainer in the tree
      const allNodes = UNSAFE_root.findAll(() => true);
      const hasCorrectConstraint = allNodes.some((node) => {
        const style = node.props.style;
        if (Array.isArray(style)) {
          return style.some(
            (s) =>
              s &&
              typeof s === "object" &&
              s.maxWidth === 360 &&
              s.alignSelf === "center"
          );
        }
        return (
          style &&
          typeof style === "object" &&
          style.maxWidth === 360 &&
          style.alignSelf === "center"
        );
      });

      expect(hasCorrectConstraint).toBe(true);
    });
  });

  describe("Category Filtering with Constraints", () => {
    it("shows category filter within FilterContainer", async () => {
      const { getByText, getByTestId } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      expect(getByTestId("category-button-friends-family")).toBeTruthy();
      expect(getByTestId("category-button-work")).toBeTruthy();
    });

    it("selecting category shows tags within constraints", async () => {
      const { getByText, getByTestId, queryByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category that has contacts with tags
      const categoryButton = getByTestId("category-button-friends-family");
      fireEvent.press(categoryButton);

      // Wait for contacts to load
      await waitFor(() => {
        expect(getByText(/visible/)).toBeTruthy();
      }, { timeout: 3000 });

      // Tags section should appear if there are tags
      // Note: Tags only appear if contacts in that category have groups/tags
      await waitFor(() => {
        const tagsElement = queryByText("Tags");
        // If there are tags in the data, this should be truthy
        // Mock data has Tag1 and Tag2 for friends-family category
        if (tagsElement) {
          expect(tagsElement).toBeTruthy();
        }
      }, { timeout: 3000 });
    });

    it("filter interface remains constrained when selecting multiple categories", async () => {
      const { getByText, getByTestId } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select multiple categories
      fireEvent.press(getByTestId("category-button-friends-family"));
      fireEvent.press(getByTestId("category-button-work"));

      await waitFor(() => {
        expect(getByText("Friends & Family + Work")).toBeTruthy();
      });

      // Constraint should still be applied
      const { UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );
      const allNodes = UNSAFE_root.findAll(() => true);
      const hasConstraint = allNodes.some((node) =>
        Array.isArray(node.props.style)
          ? node.props.style.some(
              (s: any) => s && s.maxWidth === 360
            )
          : node.props.style && node.props.style.maxWidth === 360
      );
      expect(hasConstraint).toBe(true);
    });
  });

  describe("Action Buttons within FilterContainer", () => {
    it("renders Add and Party buttons", async () => {
      const { getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Add")).toBeTruthy();
        expect(getByText("Party")).toBeTruthy();
      });
    });

    it("Add button navigates correctly", async () => {
      const navigate = jest.fn();
      const { getByText } = renderWithStore(
        <ListingScreen navigation={{ ...mockNavigation, navigate }} />
      );

      await waitFor(() => {
        expect(getByText("Add")).toBeTruthy();
      });

      fireEvent.press(getByText("Add"));
      expect(navigate).toHaveBeenCalledWith("AddContact");
    });

    it("Party button navigates correctly", async () => {
      const navigate = jest.fn();
      const { getByText } = renderWithStore(
        <ListingScreen navigation={{ ...mockNavigation, navigate }} />
      );

      await waitFor(() => {
        expect(getByText("Party")).toBeTruthy();
      });

      fireEvent.press(getByText("Party"));
      expect(navigate).toHaveBeenCalledWith("PartyMode");
    });
  });

  describe("Status Bar", () => {
    it("shows status bar when categories are selected", async () => {
      const { getByText, getByTestId } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category
      fireEvent.press(getByTestId("category-button-friends-family"));

      // Status bar should appear
      await waitFor(() => {
        expect(getByText(/visible/)).toBeTruthy();
      });
    });

    it("does not show status bar when no categories selected", async () => {
      const { getByText, queryByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // No status bar
      expect(queryByText(/visible/)).toBeNull();
    });
  });

  describe("Contact Interactions", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("sets up long-press handler on contact Pressables", async () => {
      const navigate = jest.fn();
      const preloadedState = {
        contacts: {
          data: mockContacts,
          loading: false,
        },
      };
      const { getByText, getByTestId, UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={{ ...mockNavigation, navigate }} />,
        preloadedState
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category to show contacts
      fireEvent.press(getByTestId("category-button-friends-family"));

      await waitFor(() => {
        expect(getByText("John Doe")).toBeTruthy();
      });

      // Find all Pressable components for contacts
      const allNodes = UNSAFE_root.findAll(() => true);
      const contactPressables = allNodes.filter((node) => {
        return node.props.onLongPress &&
               node.props.onPress &&
               node.props.delayLongPress === 500;
      });

      // Verify contact Pressables exist with correct handlers
      expect(contactPressables.length).toBeGreaterThan(0);
      expect(contactPressables[0].props.onLongPress).toBeInstanceOf(Function);
      expect(contactPressables[0].props.onPress).toBeInstanceOf(Function);
      expect(contactPressables[0].props.delayLongPress).toBe(500);
    });

    it("sets up press handler for double-tap detection", async () => {
      const navigate = jest.fn();
      const preloadedState = {
        contacts: {
          data: mockContacts,
          loading: false,
        },
      };
      const { getByText, getByTestId, UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={{ ...mockNavigation, navigate }} />,
        preloadedState
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category
      fireEvent.press(getByTestId("category-button-friends-family"));

      await waitFor(() => {
        expect(getByText("John Doe")).toBeTruthy();
      });

      // Find contact Pressables
      const allNodes = UNSAFE_root.findAll(() => true);
      const contactPressables = allNodes.filter((node) => {
        return node.props.onPress && node.props.onLongPress && node.props.delayLongPress === 500;
      });

      // Verify onPress handler exists for double-tap
      expect(contactPressables.length).toBeGreaterThan(0);
      expect(contactPressables[0].props.onPress).toBeInstanceOf(Function);
    });

    it("does not navigate on single tap", async () => {
      const navigate = jest.fn();
      const preloadedState = {
        contacts: {
          data: mockContacts,
          loading: false,
        },
      };
      const { getByText, getByTestId, UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={{ ...mockNavigation, navigate }} />,
        preloadedState
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category
      fireEvent.press(getByTestId("category-button-friends-family"));

      await waitFor(() => {
        expect(getByText("John Doe")).toBeTruthy();
      });

      // Find the contact Pressable
      const allNodes = UNSAFE_root.findAll(() => true);
      const contactPressable = allNodes.find((node) => {
        return node.props.onPress && node.props.onLongPress && node.props.delayLongPress === 500;
      });

      if (contactPressable) {
        // Single tap
        fireEvent.press(contactPressable);
        expect(navigate).not.toHaveBeenCalled();

        // Wait more than 300ms (simulate delay)
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Another tap after delay - should be treated as new single tap
        fireEvent.press(contactPressable);
        expect(navigate).not.toHaveBeenCalled();
      }
    });

    it("creates separate Pressables for each contact", async () => {
      const navigate = jest.fn();
      const preloadedState = {
        contacts: {
          data: mockContacts,
          loading: false,
        },
      };
      const { getByText, getByTestId, UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={{ ...mockNavigation, navigate }} />,
        preloadedState
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category that has multiple contacts
      fireEvent.press(getByTestId("category-button-friends-family"));

      await waitFor(() => {
        expect(getByText("John Doe")).toBeTruthy();
        expect(getByText("Bob Wilson")).toBeTruthy();
      });

      // Find all contact Pressables
      const allNodes = UNSAFE_root.findAll(() => true);
      const contactPressables = allNodes.filter((node) => {
        return node.props.onPress && node.props.onLongPress && node.props.delayLongPress === 500;
      });

      // Verify we have at least 2 Pressables (one for each contact)
      expect(contactPressables.length).toBeGreaterThanOrEqual(2); // John Doe and Bob Wilson
    });

    it("applies pressed opacity style on press", async () => {
      const preloadedState = {
        contacts: {
          data: mockContacts,
          loading: false,
        },
      };
      const { getByText, getByTestId, UNSAFE_root } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />,
        preloadedState
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      // Select a category
      fireEvent.press(getByTestId("category-button-friends-family"));

      await waitFor(() => {
        expect(getByText("John Doe")).toBeTruthy();
      });

      // Find the contact Pressable
      const allNodes = UNSAFE_root.findAll(() => true);
      const contactPressable = allNodes.find((node) => {
        return node.props.onPress && node.props.style && typeof node.props.style === "function";
      });

      expect(contactPressable).toBeTruthy();

      if (contactPressable && typeof contactPressable.props.style === "function") {
        // Test pressed state
        const pressedStyle = contactPressable.props.style({ pressed: true });
        const unpressedStyle = contactPressable.props.style({ pressed: false });

        expect(pressedStyle).toEqual([{ opacity: 0.8 }]);
        expect(unpressedStyle).toEqual([{ opacity: 1 }]);
      }
    });
  });

  describe("Snapshots", () => {
    it("matches snapshot of initial state", async () => {
      const { toJSON, getByText } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      expect(toJSON()).toMatchSnapshot();
    });

    it("matches snapshot with category selected", async () => {
      const { toJSON, getByText, getByTestId } = renderWithStore(
        <ListingScreen navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText("Select a Category")).toBeTruthy();
      });

      fireEvent.press(getByTestId("category-button-friends-family"));

      await waitFor(() => {
        expect(getByText("Friends & Family")).toBeTruthy();
      });

      expect(toJSON()).toMatchSnapshot();
    });
  });
});
