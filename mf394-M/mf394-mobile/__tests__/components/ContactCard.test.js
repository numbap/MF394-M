import React from "react";
import { render } from "@testing-library/react-native";
import ContactCard from "../../src/components/ContactCard";

describe("ContactCard", () => {
  const mockContact = {
    _id: "1",
    name: "John Doe",
    photo: "http://example.com/photo.jpg",
    groups: ["friends", "work"],
  };

  it("renders contact name in grid mode", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} viewMode="grid" />
    );

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders tags", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} viewMode="grid" />
    );

    expect(getByText("friends, work")).toBeTruthy();
  });

  it("renders in summary mode", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} viewMode="summary" />
    );

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders placeholder when no photo", () => {
    const contactNoPhoto = { ...mockContact, photo: null };
    const { getByText } = render(
      <ContactCard contact={contactNoPhoto} viewMode="grid" />
    );

    expect(getByText("No Image")).toBeTruthy();
  });
});
