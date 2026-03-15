import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ExtractResultsList } from "./ExtractResultsList";
import type { ExtractedPerson } from "../../store/api/extract.api";

const mockPeople: ExtractedPerson[] = [
  {
    name: "Jane Smith",
    title: "Senior Engineer",
    organization: "Google",
    faceRegion: { x: 0.1, y: 0.1, width: 0.1, height: 0.15 },
  },
  {
    name: "John Doe",
    title: null,
    organization: null,
    faceRegion: null,
  },
];

describe("ExtractResultsList", () => {
  const defaultProps = {
    people: mockPeople,
    selectedIndices: new Set([0, 1]),
    imageUri: "https://example.com/screenshot.png",
    onTogglePerson: jest.fn(),
  };

  it("renders all people", () => {
    const { getByText } = render(<ExtractResultsList {...defaultProps} />);
    expect(getByText("Jane Smith")).toBeTruthy();
    expect(getByText("John Doe")).toBeTruthy();
  });

  it("displays title and organization when present", () => {
    const { getByText } = render(<ExtractResultsList {...defaultProps} />);
    expect(getByText("Senior Engineer")).toBeTruthy();
    expect(getByText("Google")).toBeTruthy();
  });

  it("shows no face detected label when faceRegion is null", () => {
    const { getByText } = render(<ExtractResultsList {...defaultProps} />);
    expect(getByText("No face detected")).toBeTruthy();
  });

  it("calls onTogglePerson when a person row is pressed", () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <ExtractResultsList {...defaultProps} onTogglePerson={onToggle} />
    );
    fireEvent.press(getByText("Jane Smith"));
    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it("displays correct heading count", () => {
    const { getByText } = render(<ExtractResultsList {...defaultProps} />);
    expect(getByText("Found 2 people")).toBeTruthy();
  });

  it("displays singular heading for one person", () => {
    const { getByText } = render(
      <ExtractResultsList {...defaultProps} people={[mockPeople[0]]} />
    );
    expect(getByText("Found 1 person")).toBeTruthy();
  });
});
