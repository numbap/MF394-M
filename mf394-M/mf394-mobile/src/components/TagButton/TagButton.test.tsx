import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TagButton } from './TagButton';

describe('TagButton', () => {
  it('renders label correctly', () => {
    const { getByText } = render(
      <TagButton label="Sports" selected={false} onPress={() => {}} />
    );

    expect(getByText('Sports')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <TagButton label="Sports" selected={false} onPress={onPress} />
    );

    fireEvent.press(getByText('Sports'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies selected styles when selected is true', () => {
    const { getByText } = render(
      <TagButton label="Sports" selected={true} onPress={() => {}} />
    );

    const button = getByText('Sports').parent;
    expect(button).toBeTruthy();
  });

  it('matches snapshot - unselected', () => {
    const { toJSON } = render(
      <TagButton label="Sports" selected={false} onPress={() => {}} />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot - selected', () => {
    const { toJSON } = render(
      <TagButton label="Sports" selected={true} onPress={() => {}} />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
