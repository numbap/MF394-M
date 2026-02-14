import React from "react";
import { render } from "@testing-library/react-native";
import { ContactCard } from "../../src/components/ContactCard";

describe("ContactCard", () => {
  const mockContact = {
    _id: "1",
    name: "John Doe",
    hint: "Close friend",
    photo: "http://example.com/photo.jpg",
    category: "friends-family",
    groups: ["friends", "work"],
    created: Date.now(),
    edited: Date.now(),
  };

  it("renders contact name", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} />
    );

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders hint when provided", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} />
    );

    expect(getByText("Close friend")).toBeTruthy();
  });

  it("does not render hint when not provided", () => {
    const contactNoHint = { ...mockContact, hint: undefined };
    const { queryByText } = render(
      <ContactCard contact={contactNoHint} />
    );

    expect(queryByText("Close friend")).toBeFalsy();
  });

  it("renders placeholder emoji when no photo", () => {
    const contactNoPhoto = { ...mockContact, photo: undefined };
    const { getByText } = render(
      <ContactCard contact={contactNoPhoto} />
    );

    expect(getByText("👤")).toBeTruthy();
  });

  it("accepts onPress callback prop", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ContactCard contact={mockContact} onPress={onPress} />
    );

    expect(getByText("John Doe")).toBeTruthy();
  });
});
