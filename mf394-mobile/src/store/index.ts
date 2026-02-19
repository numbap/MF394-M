/**
 * Redux Store Configuration
 *
 * Combines Redux Toolkit slices, RTK Query, and custom middleware.
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { contactsApi } from './api/contacts.api';
import { authApi } from './api/auth.api';
import { tagsApi } from './api/tags.api';
import { uploadApi } from './api/upload.api';

import authReducer from './slices/auth.slice';
import uiReducer from './slices/ui.slice';
import contactsReducer from './slices/contacts.slice';
import tagsReducer from './slices/tags.slice';
import filtersReducer from './slices/filters.slice';

import { errorHandlingMiddleware } from './middleware/errorHandling.middleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    contacts: contactsReducer,
    tags: tagsReducer,
    filters: filtersReducer,

    // RTK Query APIs
    [contactsApi.reducerPath]: contactsApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [tagsApi.reducerPath]: tagsApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(contactsApi.middleware)
      .concat(authApi.middleware)
      .concat(tagsApi.middleware)
      .concat(uploadApi.middleware)
      .concat(errorHandlingMiddleware),

  devTools: {
    actionSanitizer: (action) => ({
      ...action,
      payload: action.payload instanceof File ? '[File Object]' : action.payload,
    }),
  },
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { contactsApi, authApi, tagsApi, uploadApi };
