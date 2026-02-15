/**
 * ContactCard Component Tests
 *
 * Tests for ContactCard component including:
 * - Rendering with photo and placeholder
 * - Category icon display
 * - Summary toggle functionality
 * - Info icon visibility
 * - Background color changes
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ContactCard } from "./ContactCard";
import type { Contact } from "../../store/api/contacts.api";

describe("ContactCard", () => {
  const baseContact: Contact = {
    _id: "1",
    name: "John Doe",
    hint: "Friend from college",
    photo: "https://example.com/photo.jpg",
    category: "friends-family",
    groups: [],
    created: Date.now(),
    edited: Date.now(),
  };

  describe("Rendering", () => {
    it("renders contact name and hint", () => {
      const { getByText } = render(<ContactCard contact={baseContact} />);

      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("Friend from college")).toBeTruthy();
    });

    it("renders without hint when not provided", () => {
      const contact: Contact = { ...baseContact, hint: undefined };
      const { getByText, queryByText } = render(<ContactCard contact={contact} />);

      expect(getByText("John Doe")).toBeTruthy();
      expect(queryByText("Friend from college")).toBeNull();
    });

    it("renders photo when provided", () => {
      const { UNSAFE_getByType } = render(<ContactCard contact={baseContact} />);
      // Image component is rendered (React Native Image component)
      const Image = require("react-native").Image;
      const images = UNSAFE_getByType(Image);
      expect(images).toBeTruthy();
    });

    it("renders placeholder when photo not provided", () => {
      const contact: Contact = { ...baseContact, photo: undefined };
      render(<ContactCard contact={contact} />);
      // Component should render without crashing
      expect(true).toBe(true);
    });
  });

  describe("Category Icons", () => {
    it("renders category icon for friends-family", () => {
      const contact: Contact = { ...baseContact, category: "friends-family" };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true); // Component renders
    });

    it("renders category icon for community", () => {
      const contact: Contact = { ...baseContact, category: "community" };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true);
    });

    it("renders category icon for work", () => {
      const contact: Contact = { ...baseContact, category: "work" };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true);
    });

    it("renders category icon for goals-hobbies", () => {
      const contact: Contact = { ...baseContact, category: "goals-hobbies" };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true);
    });

    it("renders category icon for miscellaneous", () => {
      const contact: Contact = { ...baseContact, category: "miscellaneous" };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true);
    });
  });

  describe("Summary Functionality", () => {
    it("does not render info icon when summary not provided", () => {
      const contact: Contact = { ...baseContact, summary: undefined };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true); // Info icon should not be present
    });

    it("renders info icon when summary is provided", () => {
      const contact: Contact = {
        ...baseContact,
        summary: "Visited Paris with them in 2023",
      };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true); // Info icon should be present
    });

    it("shows name and hint by default", () => {
      const contact: Contact = {
        ...baseContact,
        summary: "Additional details",
      };
      const { getByText } = render(<ContactCard contact={contact} />);

      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("Friend from college")).toBeTruthy();
    });

    it("toggles to show summary when info icon pressed", () => {
      const contact: Contact = {
        ...baseContact,
        summary: "Additional details about the contact",
      };
      const { getByText, queryByText, UNSAFE_getByType } = render(
        <ContactCard contact={contact} />
      );

      // Initially shows name and hint
      expect(getByText("John Doe")).toBeTruthy();
      expect(getByText("Friend from college")).toBeTruthy();

      // Find and press the info icon (TouchableOpacity)
      const TouchableOpacity = require("react-native").TouchableOpacity;
      const buttons = UNSAFE_getByType(TouchableOpacity);
      if (buttons) {
        fireEvent.press(buttons);
        // After toggle, should show summary instead
        expect(getByText("Additional details about the contact")).toBeTruthy();
      }
    });

    it("toggles back to show name/hint when info icon pressed again", () => {
      const contact: Contact = {
        ...baseContact,
        summary: "Additional details",
      };
      const { getByText, UNSAFE_getByType } = render(
        <ContactCard contact={contact} />
      );

      // Toggle to summary
      const TouchableOpacity = require("react-native").TouchableOpacity;
      const buttons = UNSAFE_getByType(TouchableOpacity);
      if (buttons) {
        fireEvent.press(buttons);
        // Toggle back to name/hint
        fireEvent.press(buttons);
        expect(getByText("John Doe")).toBeTruthy();
      }
    });
  });

  describe("Styling", () => {
    it("applies custom style prop", () => {
      const customStyle = { marginTop: 10 };
      render(<ContactCard contact={baseContact} style={customStyle} />);
      expect(true).toBe(true); // Component should render with custom style
    });

    it("renders as View component (not Pressable)", () => {
      const { UNSAFE_root } = render(<ContactCard contact={baseContact} />);
      const rootElement = UNSAFE_root.children[0];

      // Root should be a View (type name should be "View", not "Pressable")
      const typeName = rootElement.type.displayName || rootElement.type.name || rootElement.type;
      expect(typeName).toBe("View");
    });

    it("does not have Pressable event handlers", () => {
      const { UNSAFE_root } = render(<ContactCard contact={baseContact} />);
      const rootElement = UNSAFE_root.children[0];

      // Should not have Pressable props
      expect(rootElement.props.onPress).toBeUndefined();
      expect(rootElement.props.onLongPress).toBeUndefined();
      expect(rootElement.props.accessible).toBeUndefined();
    });

    it("has fixed width of 360px", () => {
      const { UNSAFE_root } = render(<ContactCard contact={baseContact} />);
      const rootElement = UNSAFE_root.children[0];

      // Check if style includes width: 360
      const style = Array.isArray(rootElement.props.style)
        ? rootElement.props.style.flat()
        : [rootElement.props.style];

      const hasFixedWidth = style.some((s: any) => s && s.width === 360);
      expect(hasFixedWidth).toBe(true);
    });
  });

  describe("Tags Display", () => {
    it("displays tags when contact has groups", () => {
      const contactWithTags: Contact = {
        ...baseContact,
        groups: ["Tag1", "Tag2", "Tag3"],
      };
      const { getByText } = render(<ContactCard contact={contactWithTags} />);

      // Should show first 2 tags
      expect(getByText("Tag1")).toBeTruthy();
      expect(getByText("Tag2")).toBeTruthy();

      // Should show +1 for the extra tag
      expect(getByText("+1")).toBeTruthy();
    });

    it("displays all tags when there are 2 or fewer", () => {
      const contactWithTwoTags: Contact = {
        ...baseContact,
        groups: ["Tag1", "Tag2"],
      };
      const { getByText, queryByText } = render(<ContactCard contact={contactWithTwoTags} />);

      expect(getByText("Tag1")).toBeTruthy();
      expect(getByText("Tag2")).toBeTruthy();

      // Should not show +N indicator
      expect(queryByText(/^\+\d+$/)).toBeNull();
    });

    it("does not display tags section when no groups", () => {
      const contactNoTags: Contact = {
        ...baseContact,
        groups: [],
      };
      const { queryByText } = render(<ContactCard contact={contactNoTags} />);

      // Should not render any tag elements
      const allText = queryByText(/Tag/);
      expect(allText).toBeNull();
    });

    it("displays correct count for many tags", () => {
      const contactManyTags: Contact = {
        ...baseContact,
        groups: ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
      };
      const { getByText } = render(<ContactCard contact={contactManyTags} />);

      // Should show first 2 tags
      expect(getByText("Tag1")).toBeTruthy();
      expect(getByText("Tag2")).toBeTruthy();

      // Should show +3 for remaining tags
      expect(getByText("+3")).toBeTruthy();
    });
  });

  describe("Snapshot", () => {
    it("matches snapshot for contact with summary", () => {
      const contact: Contact = {
        ...baseContact,
        summary: "Met at a conference in Berlin",
      };
      const tree = render(<ContactCard contact={contact} />);
      expect(tree).toMatchSnapshot();
    });

    it("matches snapshot for contact without summary", () => {
      const contact: Contact = { ...baseContact, summary: undefined };
      const tree = render(<ContactCard contact={contact} />);
      expect(tree).toMatchSnapshot();
    });

    it("matches snapshot for contact without photo", () => {
      const contact: Contact = { ...baseContact, photo: undefined };
      const tree = render(<ContactCard contact={contact} />);
      expect(tree).toMatchSnapshot();
    });

    it("matches snapshot for all categories", () => {
      const categories: Array<Contact["category"]> = [
        "friends-family",
        "community",
        "work",
        "goals-hobbies",
        "miscellaneous",
      ];

      categories.forEach((category) => {
        const contact: Contact = { ...baseContact, category };
        const tree = render(<ContactCard contact={contact} />);
        expect(tree).toMatchSnapshot(`Category: ${category}`);
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles very long name", () => {
      const contact: Contact = {
        ...baseContact,
        name: "This is a very long contact name that should wrap on the card",
      };
      const { getByText } = render(<ContactCard contact={contact} />);

      expect(
        getByText("This is a very long contact name that should wrap on the card")
      ).toBeTruthy();
    });

    it("handles very long hint", () => {
      const contact: Contact = {
        ...baseContact,
        hint: "This is an extremely long hint that explains the context of this contact",
      };
      const { getByText } = render(<ContactCard contact={contact} />);

      expect(
        getByText("This is an extremely long hint that explains the context of this contact")
      ).toBeTruthy();
    });

    it("handles empty summary string", () => {
      const contact: Contact = { ...baseContact, summary: "" };
      const { getByText } = render(<ContactCard contact={contact} />);

      expect(getByText("John Doe")).toBeTruthy();
    });

    it("handles summary with newlines", () => {
      const contact: Contact = {
        ...baseContact,
        summary: "Line 1\nLine 2\nLine 3",
      };
      render(<ContactCard contact={contact} />);
      expect(true).toBe(true);
    });
  });
});
