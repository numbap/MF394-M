/**
 * UI Slice
 *
 * Manages application UI state including theme, toast notifications, and modal states
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  theme: 'light' | 'dark';
  toasts: Toast[];
  isModalOpen: boolean;
  modalData?: any;
}

const initialState: UIState = {
  theme: 'light',
  toasts: [],
  isModalOpen: false,
  modalData: undefined,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // Toast notifications
    addToast: (state, action: PayloadAction<Toast>) => {
      state.toasts.push(action.payload);
    },

    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },

    clearToasts: (state) => {
      state.toasts = [];
    },

    // Modal
    openModal: (
      state,
      action: PayloadAction<{ data?: any }>
    ) => {
      state.isModalOpen = true;
      state.modalData = action.payload.data;
    },

    closeModal: (state) => {
      state.isModalOpen = false;
      state.modalData = undefined;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;
