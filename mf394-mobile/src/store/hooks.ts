/**
 * Redux Hooks
 *
 * Type-safe hooks for accessing Redux store and dispatch
 * Always use these instead of useSelector/useDispatch directly
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * App dispatch hook
 * Use this instead of useDispatch() for type safety
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(loginUser(credentials));
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * App selector hook
 * Use this instead of useSelector() for type safety
 *
 * @example
 * const user = useAppSelector(state => state.auth.user);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Selector shortcuts for common state access

export const selectAuth = (state: RootState) => state.auth;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;

export const selectUI = (state: RootState) => state.ui;
export const selectUITheme = (state: RootState) => state.ui.theme;
export const selectUIToast = (state: RootState) => state.ui.toast;

export const selectSync = (state: RootState) => state.sync;
export const selectSyncQueue = (state: RootState) => state.sync.queue;
export const selectSyncIsSyncing = (state: RootState) => state.sync.isSyncing;
export const selectSyncErrors = (state: RootState) => state.sync.errors;
