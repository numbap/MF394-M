/**
 * Error Handling Middleware
 *
 * Intercepts API errors and handles them globally.
 * Converts errors to user-friendly toast messages.
 */

import { isRejectedWithValue } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import { addToast } from '../slices/ui.slice';
import { loginFailure, logout } from '../slices/auth.slice';
import { v4 as uuidv4 } from 'uuid';

/**
 * Log a warning and show user-friendly toast on every error.
 */
export const errorHandlingMiddleware: Middleware = (storeAPI) => (next) => (action) => {
  // RTK Query rejected action payload
  if (isRejectedWithValue(action)) {
    const payload = action.payload as any;

    // Extract error message
    let message = 'An error occurred. Please try again.';
    let shouldLogout = false;

    if (payload?.status === 401) {
      // Unauthorized - token expired or invalid
      message = 'Session expired. Please log in again.';
      shouldLogout = true;
    } else if (payload?.status === 403) {
      // Forbidden - user doesn't have permission
      message = 'You don\'t have permission to perform this action.';
    } else if (payload?.status === 404) {
      // Not found
      message = 'Resource not found.';
    } else if (payload?.status === 422 || payload?.status === 400) {
      // Validation error
      if (payload?.data?.message) {
        message = payload.data.message;
      } else if (payload?.data?.errors) {
        message = Object.values(payload.data.errors)
          .flat()
          .join(', ') as string;
      }
    } else if (payload?.status === 429) {
      // Rate limited
      message = 'Too many requests. Please try again later.';
    } else if (payload?.status === 500 || payload?.status === 502) {
      // Server error
      message = 'Server error. Please try again later.';
    } else if (payload?.data?.message) {
      message = payload.data.message;
    }

    // Dispatch toast notification
    storeAPI.dispatch(
      addToast({
        id: uuidv4(),
        type: 'error',
        message,
        duration: 5000,
      })
    );

    // Handle unauthorized (token expired)
    if (shouldLogout) {
      storeAPI.dispatch(logout());
    }
  }

  return next(action);
};
