/**
 * Toast Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders with message', () => {
    const { getByText } = render(<Toast message="Test message" visible />);
    expect(getByText('Test message')).toBeTruthy();
  });

  it('renders success variant', () => {
    const { getByText } = render(
      <Toast message="Success!" variant="success" visible />
    );
    expect(getByText('Success!')).toBeTruthy();
  });

  it('renders error variant', () => {
    const { getByText } = render(
      <Toast message="Error occurred" variant="error" visible />
    );
    expect(getByText('Error occurred')).toBeTruthy();
  });

  it('renders info variant', () => {
    const { getByText } = render(
      <Toast message="Info message" variant="info" visible />
    );
    expect(getByText('Info message')).toBeTruthy();
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <Toast message="Hidden message" visible={false} />
    );
    expect(queryByText('Hidden message')).toBeNull();
  });

  it('calls onDismiss after duration', (done) => {
    const onDismiss = jest.fn();
    render(
      <Toast message="Auto dismiss" duration={100} onDismiss={onDismiss} visible />
    );

    setTimeout(() => {
      expect(onDismiss).toHaveBeenCalled();
      done();
    }, 500);
  });
});
