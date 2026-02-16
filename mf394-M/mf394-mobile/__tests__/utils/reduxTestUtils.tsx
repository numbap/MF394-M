/**
 * Redux Test Utilities
 *
 * Provides helpers for testing components that use Redux.
 * Creates mock stores with actual reducers to match production behavior.
 */

import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { render, RenderOptions } from '@testing-library/react-native';

// Import actual reducers
import tagsReducer from '../../src/store/slices/tags.slice';
import contactsReducer from '../../src/store/slices/contacts.slice';
import authReducer from '../../src/store/slices/auth.slice';
import uiReducer from '../../src/store/slices/ui.slice';
import syncReducer from '../../src/store/slices/sync.slice';
import filtersReducer from '../../src/store/slices/filters.slice';

import type { RootState } from '../../src/store';

/**
 * Create a mock Redux store for testing
 * Uses actual reducers to ensure test behavior matches production
 */
export function createMockStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      tags: tagsReducer,
      contacts: contactsReducer,
      auth: authReducer,
      ui: uiReducer,
      sync: syncReducer,
      filters: filtersReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable for tests
      }),
  });
}

/**
 * Render component with Redux Provider wrapper
 *
 * Usage:
 * const { store, getByText } = renderWithRedux(<MyComponent />, {
 *   preloadedState: { tags: { tags: ['Sports', 'Music'] } }
 * });
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof createMockStore>;
}

export function renderWithRedux(
  ui: ReactElement,
  {
    preloadedState,
    store = createMockStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
