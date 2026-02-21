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

const defaultProps = {
  visible: true,
  score: 4,
  total: 5,
  onPlayAgain: jest.fn(),
};

describe("QuizCelebration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when visible is true", () => {
    const { getByText } = render(<QuizCelebration {...defaultProps} />);
    expect(getByText("Great job!")).toBeTruthy();
    expect(getByText("You got 4 out of 5 right!")).toBeTruthy();
    expect(getByText("Play Again")).toBeTruthy();
  });

  it("does not render content when visible is false", () => {
    const { queryByText } = render(
      <QuizCelebration {...defaultProps} visible={false} />
    );
    expect(queryByText("Great job!")).toBeNull();
    expect(queryByText("Play Again")).toBeNull();
  });

  it("shows the correct score", () => {
    const { getByText } = render(
      <QuizCelebration {...defaultProps} score={3} total={5} />
    );
    expect(getByText("You got 3 out of 5 right!")).toBeTruthy();
  });

  it("shows perfect score", () => {
    const { getByText } = render(
      <QuizCelebration {...defaultProps} score={5} total={5} />
    );
    expect(getByText("You got 5 out of 5 right!")).toBeTruthy();
  });

  it("shows zero score", () => {
    const { getByText } = render(
      <QuizCelebration {...defaultProps} score={0} total={5} />
    );
    expect(getByText("You got 0 out of 5 right!")).toBeTruthy();
  });

  it("calls onPlayAgain when Play Again button pressed", () => {
    const onPlayAgain = jest.fn();
    const { getByText } = render(
      <QuizCelebration {...defaultProps} onPlayAgain={onPlayAgain} />
    );
    fireEvent.press(getByText("Play Again"));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("matches snapshot when visible", () => {
    const { toJSON } = render(<QuizCelebration {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("matches snapshot when hidden", () => {
    const { toJSON } = render(
      <QuizCelebration {...defaultProps} visible={false} />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
