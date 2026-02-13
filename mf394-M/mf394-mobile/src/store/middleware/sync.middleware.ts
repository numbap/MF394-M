/**
 * Sync Middleware
 *
 * Processes offline sync queue when connectivity is restored.
 * Handles mutation retry logic and conflict resolution.
 */

import { isAnyOf } from '@reduxjs/toolkit';
import type { Middleware, AnyAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import {
  setSyncing,
  removeFromQueue,
  updateQueuedMutation,
  addSyncError,
} from '../slices/sync.slice';
import { addToast } from '../slices/ui.slice';
import { v4 as uuidv4 } from 'uuid';

// Track if we're currently processing the queue to avoid duplicate processing
let isProcessing = false;

/**
 * Sync middleware that processes queued mutations when:
 * 1. App comes online
 * 2. Auth token is refreshed
 * 3. Manually triggered
 */
export const syncMiddleware: Middleware<{}, RootState> = (storeAPI) => (next) => (action) => {
  const result = next(action);

  // Trigger sync processing on specific conditions
  const shouldProcessQueue =
    action.type === 'sync/processSyncQueue' ||
    action.type === 'auth/loginSuccess' ||
    action.type === 'auth/restoreSession' ||
    action.type === 'auth/setAccessToken';

  if (shouldProcessQueue && !isProcessing) {
    processQueue(storeAPI);
  }

  return result;
};

/**
 * Process all queued mutations sequentially
 */
async function processQueue(storeAPI: any): Promise<void> {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const state = storeAPI.getState() as RootState;
    const queue = [...state.sync.queue];

    if (queue.length === 0) {
      isProcessing = false;
      return;
    }

    storeAPI.dispatch(setSyncing(true));

    // Process each mutation in order
    for (const mutation of queue) {
      try {
        // Execute the queued action through dispatch
        const actionResult = await storeAPI.dispatch(mutation.action);

        // Check if action was successful
        if (actionResult?.error) {
          handleMutationError(storeAPI, mutation, actionResult.error);
        } else {
          // Remove successful mutation from queue
          storeAPI.dispatch(removeFromQueue(mutation.id));

          storeAPI.dispatch(
            addToast({
              id: uuidv4(),
              type: 'success',
              message: 'Changes synced',
              duration: 2000,
            })
          );
        }
      } catch (error) {
        handleMutationError(storeAPI, mutation, error);
      }
    }

    storeAPI.dispatch(setSyncing(false));
  } finally {
    isProcessing = false;
  }
}

/**
 * Handle mutation errors with retry logic
 */
function handleMutationError(storeAPI: any, mutation: any, error: any): void {
  const maxRetries = mutation.maxRetries || 3;
  const nextRetryCount = (mutation.retryCount || 0) + 1;

  if (nextRetryCount < maxRetries) {
    // Retry the mutation
    storeAPI.dispatch(
      updateQueuedMutation({
        id: mutation.id,
        update: {
          retryCount: nextRetryCount,
        },
      })
    );

    storeAPI.dispatch(
      addToast({
        id: uuidv4(),
        type: 'info',
        message: `Retrying... (${nextRetryCount}/${maxRetries})`,
        duration: 2000,
      })
    );
  } else {
    // Max retries exceeded - add to errors
    const errorId = uuidv4();
    storeAPI.dispatch(
      addSyncError({
        id: errorId,
        mutationId: mutation.id,
        error: error?.message || 'Unknown error',
        timestamp: Date.now(),
      })
    );

    storeAPI.dispatch(
      addToast({
        id: uuidv4(),
        type: 'error',
        message: `Failed to sync: ${error?.message || 'Unknown error'}`,
        duration: 5000,
      })
    );

    // Keep the mutation in queue for manual retry later
  }
}

// Action to manually trigger sync processing
export const processSyncQueue = () => ({
  type: 'sync/processSyncQueue',
});
