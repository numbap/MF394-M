/**
 * useGoogleAuth hook tests (native)
 *
 * Tests the native Google Sign-In flow. GoogleSignin is mocked in
 * __tests__/setup.js. useLoginMutation is mocked here to avoid real HTTP calls.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useGoogleAuth } from './useGoogleAuth';
import authReducer from '../store/slices/auth.slice';

const mockLoginUnwrap = jest.fn();
const mockLogin = jest.fn(() => ({ unwrap: mockLoginUnwrap }));

jest.mock('../store/api/auth.api', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (state = {}) => state,
    middleware: () => (next: any) => (action: any) => next(action),
  },
  useLoginMutation: () => [mockLogin, { isLoading: false }],
}));

function makeStore() {
  return configureStore({
    reducer: { auth: authReducer },
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const store = makeStore();
  return React.createElement(Provider, { store }, children);
}

describe('useGoogleAuth', () => {
  beforeEach(() => {
    mockLoginUnwrap.mockResolvedValue({
      token: 'test-jwt-token',
      user: {
        _id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns signInWithGoogle function', () => {
    const { result } = renderHook(() => useGoogleAuth(), { wrapper });
    expect(typeof result.current.signInWithGoogle).toBe('function');
  });

  it('dispatches loginSuccess after successful Google Sign-In', async () => {
    const store = makeStore();
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useGoogleAuth(), { wrapper: localWrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@example.com');
    expect(state.token).toBe('test-jwt-token');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('dispatches loginStart before loginSuccess', async () => {
    const store = makeStore();
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const dispatchedTypes: string[] = [];
    const unsubscribe = store.subscribe(() => {
      const state = store.getState().auth;
      if (state.isLoading && !state.isAuthenticated) {
        dispatchedTypes.push('loading');
      } else if (state.isAuthenticated) {
        dispatchedTypes.push('authenticated');
      }
    });

    const { result } = renderHook(() => useGoogleAuth(), { wrapper: localWrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    unsubscribe();

    expect(dispatchedTypes).toContain('loading');
    expect(dispatchedTypes).toContain('authenticated');
    expect(dispatchedTypes.indexOf('loading')).toBeLessThan(
      dispatchedTypes.indexOf('authenticated')
    );
  });

  it('dispatches loginFailure when sign-in is cancelled', async () => {
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
    GoogleSignin.signIn.mockRejectedValueOnce({ code: statusCodes.SIGN_IN_CANCELLED });

    const store = makeStore();
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useGoogleAuth(), { wrapper: localWrapper });

    await act(async () => {
      try {
        await result.current.signInWithGoogle();
      } catch {
        // cancelled errors don't propagate
      }
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Sign-in cancelled');
  });

  it('dispatches loginFailure when no idToken is returned', async () => {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.signIn.mockResolvedValueOnce({ idToken: null });

    const store = makeStore();
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useGoogleAuth(), { wrapper: localWrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('No ID token received from Google');
  });
});
