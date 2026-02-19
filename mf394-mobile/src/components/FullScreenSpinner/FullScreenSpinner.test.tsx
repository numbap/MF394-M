/**
 * FullScreenSpinner Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FullScreenSpinner } from './FullScreenSpinner';

describe('FullScreenSpinner', () => {
  it('renders loading state correctly', () => {
    const { getByText, queryByText } = render(
      <FullScreenSpinner visible={true} variant="loading" message="Saving..." />
    );

    expect(getByText('Saving...')).toBeTruthy();
    expect(queryByText('Back')).toBeNull();
  });

  it('renders error state with back button', () => {
    const mockOnBack = jest.fn();
    const { getByText } = render(
      <FullScreenSpinner
        visible={true}
        variant="error"
        errorMessage="Save failed"
        onBack={mockOnBack}
      />
    );

    expect(getByText('Save failed')).toBeTruthy();
    expect(getByText('Back')).toBeTruthy();

    fireEvent.press(getByText('Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <FullScreenSpinner visible={false} message="Should not appear" />
    );

    expect(queryByText('Should not appear')).toBeNull();
  });

  it('uses default messages when not provided', () => {
    const { getByText } = render(
      <FullScreenSpinner visible={true} variant="loading" />
    );

    expect(getByText('Saving...')).toBeTruthy();
  });

  it('uses default error message when not provided', () => {
    const { getByText } = render(
      <FullScreenSpinner visible={true} variant="error" onBack={() => {}} />
    );

    expect(getByText('An error occurred')).toBeTruthy();
  });
});
