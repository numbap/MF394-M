import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SettingsScreen from './SettingsScreen';
import authReducer from '../../store/slices/auth.slice';
import { tokenStorage } from '../../utils/secureStore';

// Mock tokenStorage
jest.mock('../../utils/secureStore', () => ({
  tokenStorage: {
    clearToken: jest.fn().mockResolvedValue(undefined),
  },
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

  it('clears token before dispatching logout', async () => {
    const callOrder: string[] = [];
    (tokenStorage.clearToken as jest.Mock).mockImplementation(async () => {
      callOrder.push('clearToken');
    });

    const store = createMockStore();
    const originalDispatch = store.dispatch.bind(store);
    store.dispatch = jest.fn((action) => {
      if (action.type === 'auth/logout') {
        callOrder.push('logout');
      }
      return originalDispatch(action);
    }) as typeof store.dispatch;

    const { getByText } = render(
      <Provider store={store}>
        <SettingsScreen />
      </Provider>
    );

    await act(async () => {
      fireEvent.press(getByText('Log Out'));
    });

    expect(callOrder).toEqual(['clearToken', 'logout']);
  });
});
