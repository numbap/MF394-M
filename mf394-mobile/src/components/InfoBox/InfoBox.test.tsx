import React from 'react';
import { render } from '@testing-library/react-native';
import { InfoBox } from './InfoBox';

describe('InfoBox', () => {
  it('renders text correctly', () => {
    const { getByText } = render(
      <InfoBox text="This is an informational message" />
    );

    expect(getByText('This is an informational message')).toBeTruthy();
  });

  it('uses default icon when not specified', () => {
    const { toJSON } = render(<InfoBox text="Info message" />);

    expect(toJSON()).toBeTruthy();
  });

  it('uses custom icon when provided', () => {
    const { toJSON } = render(<InfoBox text="Warning" icon="exclamation-triangle" />);

    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <InfoBox
        text="Upload a photo with multiple faces. We'll detect each person and let you name them."
        icon="info-circle"
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
