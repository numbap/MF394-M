/**
 * Redux Store Configuration
 *
 * Combines Redux Toolkit slices, RTK Query, and custom middleware
 * for a robust state management solution.
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { contactsApi } from './api/contacts.api';
import { imagesApi } from './api/images.api';
import { authApi } from './api/auth.api';

import authReducer from './slices/auth.slice';
import uiReducer from './slices/ui.slice';
import syncReducer from './slices/sync.slice';

import { syncMiddleware } from './middleware/sync.middleware';
import { errorHandlingMiddleware } from './middleware/errorHandling.middleware';

/**
 * Configure the Redux store with all slices and RTK Query APIs
 */
export const store = configureStore({
  reducer: {
    // Redux slices
    auth: authReducer,
    ui: uiReducer,
    sync: syncReducer,

    // RTK Query APIs
    [contactsApi.reducerPath]: contactsApi.reducer,
    [imagesApi.reducerPath]: imagesApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from serialization checks
        ignoredActions: [
          'sync/addToQueue',
          'sync/processQueue/fulfilled',
        ],
        // Ignore these paths in state from serialization checks
        ignoredActionPaths: ['sync/queue'],
        ignoredPaths: ['sync/queue'],
      },
    })
      .concat(contactsApi.middleware)
      .concat(imagesApi.middleware)
      .concat(authApi.middleware)
      .concat(syncMiddleware)
      .concat(errorHandlingMiddleware),

  devTools: {
    // Redux DevTools configuration
    actionSanitizer: (action) => ({
      ...action,
      payload: action.payload instanceof File ? '[File Object]' : action.payload,
    }),
  },
});

// Setup listeners for RTK Query cache invalidation
setupListeners(store.dispatch);

// Type exports for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export all APIs for use in hooks
export { contactsApi, imagesApi, authApi };
