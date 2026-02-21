/**
 * useGoogleAuth hook tests
 *
 * These tests run with AUTH_MOCK=true (set in __tests__/setup.js),
 * so the mock auth path is exercised without requiring native GoogleSignin.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { useGoogleAuth } from './useGoogleAuth';
import authReducer from '../store/slices/auth.slice';
import { authApi } from '../store/api/auth.api';

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware),
  });
}

function wrapper({ children }: { children: React.ReactNode }) {
  const store = makeStore();
  return React.createElement(Provider, { store }, children);
}

describe('useGoogleAuth', () => {
  it('returns signInWithGoogle function', () => {
    const { result } = renderHook(() => useGoogleAuth(), { wrapper });
    expect(typeof result.current.signInWithGoogle).toBe('function');
  });

  it('dispatches loginSuccess with mock user when AUTH_MOCK=true', async () => {
    const store = makeStore();
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);

    const { result } = renderHook(() => useGoogleAuth(), { wrapper: localWrapper });

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('dev@ummyou.com');
    expect(state.user?.id).toBe('mock-user-1');
    expect(state.token).toBe('mock-jwt-token');
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
      // Record the auth state after each dispatch
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
});
