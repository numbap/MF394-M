import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';

describe('AnimatedPressable', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <AnimatedPressable>
        <Text>Press me</Text>
      </AnimatedPressable>
    );

    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressable onPress={onPress}>
        <Text>Press me</Text>
      </AnimatedPressable>
    );

    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPressIn and onPressOut handlers', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const { getByText } = render(
      <AnimatedPressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <Text>Press me</Text>
      </AnimatedPressable>
    );

    const element = getByText('Press me');
    fireEvent(element, 'pressIn');
    expect(onPressIn).toHaveBeenCalledTimes(1);

    fireEvent(element, 'pressOut');
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <AnimatedPressable>
        <Text>Press me</Text>
      </AnimatedPressable>
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
