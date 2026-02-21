/**
 * QuizCelebration Component Tests
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { QuizCelebration } from "./QuizCelebration";

jest.mock("react-native-reanimated", () => {
  const View = require("react-native").View;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: jest.fn((val: any) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb: any) => cb()),
    withTiming: jest.fn((val: any) => val),
    withDelay: jest.fn((_delay: any, val: any) => val),
  };
});

jest.mock("@expo/vector-icons", () => ({
  FontAwesome: "FontAwesome",
}));

const defaultProps = {
  onPlayAgain: jest.fn(),
};

describe("QuizCelebration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Great job headline", () => {
    const { getByText } = render(<QuizCelebration {...defaultProps} />);
    expect(getByText("Great job!")).toBeTruthy();
  });

  it("does not render score text", () => {
    const { queryByText } = render(<QuizCelebration {...defaultProps} />);
    expect(queryByText(/You got/)).toBeNull();
    expect(queryByText(/out of/)).toBeNull();
  });

  it("renders the restart button", () => {
    const { getByTestId } = render(<QuizCelebration {...defaultProps} />);
    expect(getByTestId("play-again-button")).toBeTruthy();
  });

  it("calls onPlayAgain when restart button is pressed", () => {
    const onPlayAgain = jest.fn();
    const { getByTestId } = render(
      <QuizCelebration onPlayAgain={onPlayAgain} />
    );
    fireEvent.press(getByTestId("play-again-button"));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("matches snapshot", () => {
    const { toJSON } = render(<QuizCelebration {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
