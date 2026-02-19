import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders title correctly', () => {
    const { getByText } = render(<LoadingState title="Loading..." />);

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <LoadingState title="Loading..." subtitle="Please wait" />
    );

    expect(getByText('Loading...')).toBeTruthy();
    expect(getByText('Please wait')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(<LoadingState title="Loading..." />);

    expect(queryByText('Please wait')).toBeNull();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <LoadingState title="Scanning for Faces" subtitle="Analyzing your photo..." />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
