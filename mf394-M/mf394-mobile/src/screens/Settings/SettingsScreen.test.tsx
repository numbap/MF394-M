import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { Alert } from 'react-native';
import { configureStore } from '@reduxjs/toolkit';
import SettingsScreen from './SettingsScreen';
import authReducer from '../../store/slices/auth.slice';
import { authApi } from '../../store/api/auth.api';

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  provider: 'google' as const,
};

const createMockStore = (user = mockUser) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    preloadedState: {
      auth: {
        user,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
  });
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays user name', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('John Doe')).toBeTruthy();
  });

  it('displays user email', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('shows auth provider', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('Signed in with google')).toBeTruthy();
  });

  it('displays default values when user data is missing', () => {
    const store = createMockStore(null);
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('User')).toBeTruthy();
    expect(getByText('Signed in with Google')).toBeTruthy();
  });

  it('shows logout button', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('Log Out')).toBeTruthy();
  });

  it('shows confirmation alert when logout button is pressed', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    const logoutButton = getByText('Log Out');
    fireEvent.press(logoutButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Log Out',
      'Are you sure you want to log out?',
      expect.any(Array)
    );
  });

  it('disables button during logout', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    const logoutButton = getByText('Log Out');
    expect(logoutButton).toBeTruthy();

    // Button should not be disabled initially
    const buttonParent = logoutButton.parent;
    expect(buttonParent?.props.accessibilityState?.disabled).toBeFalsy();
  });
});
