import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SettingsScreen from './SettingsScreen';
import authReducer from '../../store/slices/auth.slice';
import { tokenStorage } from '../../utils/secureStore';
import { showAlert } from '../../utils/showAlert';

// Mock dependencies
jest.mock('../../utils/secureStore', () => ({
  tokenStorage: {
    clearToken: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/sessionCache', () => ({
  clearSessionCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/filterCache', () => ({
  clearFilterSnapshot: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/showAlert', () => ({
  showAlert: jest.fn(),
}));

// Mock the delete account mutation hook
const mockDeleteAccount = jest.fn();
const mockDeleteAccountResult = {
  isLoading: false,
  isError: false,
  reset: jest.fn(),
};

jest.mock('../../store/api/auth.api', () => ({
  useDeleteAccountMutation: () => [mockDeleteAccount, mockDeleteAccountResult],
}));

// Mock the store API util methods
jest.mock('../../store', () => ({
  contactsApi: { util: { resetApiState: () => ({ type: 'contactsApi/resetApiState' }) } },
  authApi: { util: { resetApiState: () => ({ type: 'authApi/resetApiState' }) } },
  tagsApi: { util: { resetApiState: () => ({ type: 'tagsApi/resetApiState' }) } },
  uploadApi: { util: { resetApiState: () => ({ type: 'uploadApi/resetApiState' }) } },
  extractApi: { util: { resetApiState: () => ({ type: 'extractApi/resetApiState' }) } },
}));

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
    },
    preloadedState: {
      auth: {
        user,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
    },
  });
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteAccountResult.isLoading = false;
    mockDeleteAccount.mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) });
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

  it('clears token when logout button is pressed', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    await act(async () => {
      fireEvent.press(getByText('Log Out'));
    });

    expect(tokenStorage.clearToken).toHaveBeenCalledTimes(1);
  });

  it('clears auth state when logout button is pressed', async () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    await act(async () => {
      fireEvent.press(getByText('Log Out'));
    });

    const state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  // Delete Account tests

  it('renders Delete Account button', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('Delete Account')).toBeTruthy();
  });

  it('shows confirmation dialog when Delete Account is pressed', () => {
    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    fireEvent.press(getByText('Delete Account'));

    expect(showAlert).toHaveBeenCalledWith(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete Account', style: 'destructive' }),
      ]),
    );
  });

  it('calls deleteAccount mutation when confirmed', async () => {
    const mockUnwrap = jest.fn().mockResolvedValue(undefined);
    mockDeleteAccount.mockReturnValue({ unwrap: mockUnwrap });

    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    fireEvent.press(getByText('Delete Account'));

    // Extract the destructive button's onPress callback
    const alertCall = (showAlert as jest.Mock).mock.calls[0];
    const destructiveButton = alertCall[2].find(
      (btn: any) => btn.style === 'destructive'
    );

    await act(async () => {
      await destructiveButton.onPress();
    });

    expect(mockDeleteAccount).toHaveBeenCalled();
    expect(mockUnwrap).toHaveBeenCalled();
  });

  it('clears all state after successful account deletion', async () => {
    const mockUnwrap = jest.fn().mockResolvedValue(undefined);
    mockDeleteAccount.mockReturnValue({ unwrap: mockUnwrap });

    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    fireEvent.press(getByText('Delete Account'));

    const alertCall = (showAlert as jest.Mock).mock.calls[0];
    const destructiveButton = alertCall[2].find(
      (btn: any) => btn.style === 'destructive'
    );

    await act(async () => {
      await destructiveButton.onPress();
    });

    // Auth state should be cleared
    const state = store.getState();
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
    expect(state.auth.isAuthenticated).toBe(false);

    // Token storage should be cleared
    expect(tokenStorage.clearToken).toHaveBeenCalled();
  });

  it('does not clear state when account deletion fails', async () => {
    const mockUnwrap = jest.fn().mockRejectedValue(new Error('Server error'));
    mockDeleteAccount.mockReturnValue({ unwrap: mockUnwrap });

    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    fireEvent.press(getByText('Delete Account'));

    const alertCall = (showAlert as jest.Mock).mock.calls[0];
    const destructiveButton = alertCall[2].find(
      (btn: any) => btn.style === 'destructive'
    );

    await act(async () => {
      await destructiveButton.onPress();
    });

    // Auth state should NOT be cleared
    const state = store.getState();
    expect(state.auth.user).toEqual(mockUser);
    expect(state.auth.isAuthenticated).toBe(true);

    // Token should NOT be cleared
    expect(tokenStorage.clearToken).not.toHaveBeenCalled();
  });

  it('shows loading state while deleting', () => {
    mockDeleteAccountResult.isLoading = true;

    const store = createMockStore();
    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    expect(getByText('Deleting Account...')).toBeTruthy();
  });
});
