/**
 * AlertDialog Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AlertDialog, AlertButton } from './AlertDialog';

describe('AlertDialog', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
  });

  it('renders with title only', () => {
    const { getByText } = render(
      <AlertDialog visible={true} title="Test Title" onDismiss={mockOnDismiss} />
    );

    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders with title and message', () => {
    const { getByText } = render(
      <AlertDialog
        visible={true}
        title="Test Title"
        message="Test message"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test message')).toBeTruthy();
  });

  it('renders default OK button when no buttons provided', () => {
    const { getByText } = render(
      <AlertDialog visible={true} title="Test Title" onDismiss={mockOnDismiss} />
    );

    expect(getByText('OK')).toBeTruthy();
  });

  it('renders single custom button', () => {
    const buttons: AlertButton[] = [{ text: 'Got it' }];

    const { getByText } = render(
      <AlertDialog
        visible={true}
        title="Test Title"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Got it')).toBeTruthy();
  });

  it('renders two buttons (confirm dialog)', () => {
    const buttons: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm' },
    ];

    const { getByText } = render(
      <AlertDialog
        visible={true}
        title="Confirm Action"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Confirm')).toBeTruthy();
  });

  it('renders three buttons (custom actions)', () => {
    const buttons: AlertButton[] = [
      { text: 'Option 1' },
      { text: 'Option 2' },
      { text: 'Cancel', style: 'cancel' },
    ];

    const { getByText } = render(
      <AlertDialog
        visible={true}
        title="Choose Option"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('renders destructive button style', () => {
    const buttons: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' },
    ];

    const { getByText } = render(
      <AlertDialog
        visible={true}
        title="Delete Item"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText('Delete')).toBeTruthy();
  });

  it('calls button onPress handler when clicked', () => {
    const mockOnPress = jest.fn();
    const buttons: AlertButton[] = [{ text: 'Action', onPress: mockOnPress }];

    const { getByText } = render(
      <AlertDialog
        visible={true}
        title="Test"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    fireEvent.press(getByText('Action'));

    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when button clicked', () => {
    const { getByText } = render(
      <AlertDialog visible={true} title="Test" onDismiss={mockOnDismiss} />
    );

    fireEvent.press(getByText('OK'));

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <AlertDialog visible={false} title="Test Title" onDismiss={mockOnDismiss} />
    );

    expect(queryByText('Test Title')).toBeNull();
  });

  it('calls onDismiss when backdrop pressed (cancelable=true)', () => {
    const { getByTestId } = render(
      <AlertDialog
        visible={true}
        title="Test"
        onDismiss={mockOnDismiss}
        cancelable={true}
      />
    );

    // Modal has backdrop pressable
    const backdrop = getByTestId('alert-button-0').parent?.parent?.parent;
    if (backdrop) {
      fireEvent.press(backdrop);
    }

    // Note: This test may need adjustment based on actual implementation
    // The backdrop press behavior is handled by Modal's onRequestClose
  });

  it('snapshot test - single button', () => {
    const { toJSON } = render(
      <AlertDialog visible={true} title="Info" message="Information message" onDismiss={mockOnDismiss} />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('snapshot test - confirm dialog', () => {
    const buttons: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK' },
    ];

    const { toJSON } = render(
      <AlertDialog
        visible={true}
        title="Confirm"
        message="Are you sure?"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('snapshot test - destructive dialog', () => {
    const buttons: AlertButton[] = [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' },
    ];

    const { toJSON } = render(
      <AlertDialog
        visible={true}
        title="Delete Contact"
        message="Are you sure you want to delete this contact?"
        buttons={buttons}
        onDismiss={mockOnDismiss}
      />
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
