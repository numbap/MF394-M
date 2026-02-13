/**
 * Sync Slice
 *
 * Manages offline sync queue for handling mutations when offline.
 * Works with syncMiddleware to process queued actions.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QueuedMutation {
  id: string;
  timestamp: number;
  action: {
    type: string;
    payload: any;
  };
  retryCount: number;
  maxRetries: number;
}

interface SyncError {
  id: string;
  mutationId: string;
  error: string;
  timestamp: number;
}

interface SyncState {
  queue: QueuedMutation[];
  isSyncing: boolean;
  errors: SyncError[];
  lastSyncTime: number | null;
}

const initialState: SyncState = {
  queue: [],
  isSyncing: false,
  errors: [],
  lastSyncTime: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    // Queue management
    addToQueue: (state, action: PayloadAction<QueuedMutation>) => {
      state.queue.push(action.payload);
    },

    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((item) => item.id !== action.payload);
    },

    clearQueue: (state) => {
      state.queue = [];
    },

    updateQueuedMutation: (
      state,
      action: PayloadAction<{ id: string; update: Partial<QueuedMutation> }>
    ) => {
      const item = state.queue.find((q) => q.id === action.payload.id);
      if (item) {
        Object.assign(item, action.payload.update);
      }
    },

    // Sync status
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
      if (action.payload === false && state.queue.length === 0) {
        state.lastSyncTime = Date.now();
      }
    },

    // Error tracking
    addSyncError: (state, action: PayloadAction<SyncError>) => {
      state.errors.push(action.payload);
      // Keep only last 10 errors
      if (state.errors.length > 10) {
        state.errors.shift();
      }
    },

    removeSyncError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((err) => err.id !== action.payload);
    },

    clearSyncErrors: (state) => {
      state.errors = [];
    },

    // Reset sync state
    resetSync: (state) => {
      state.queue = [];
      state.isSyncing = false;
      state.errors = [];
      state.lastSyncTime = null;
    },
  },
});

export const {
  addToQueue,
  removeFromQueue,
  clearQueue,
  updateQueuedMutation,
  setSyncing,
  addSyncError,
  removeSyncError,
  clearSyncErrors,
  resetSync,
} = syncSlice.actions;

export default syncSlice.reducer;
