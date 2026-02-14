/**
 * Contacts Redux Slice (Temporary)
 *
 * Stores contact data from mock data until the real API is integrated.
 * This slice will be replaced with RTK Query when we connect to the backend API.
 *
 * TODO: Replace with contactsApi.useGetContactsQuery() when API is ready
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Contact } from '../api/contacts.api';

interface ContactsState {
  data: Contact[];
  loading: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  data: [],
  loading: false,
  error: null,
};

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.data = action.payload;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addContact: (state, action: PayloadAction<Contact>) => {
      state.data.push(action.payload);
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const index = state.data.findIndex((c) => c._id === action.payload._id);
      if (index !== -1) {
        state.data[index] = action.payload;
      }
    },
    deleteContact: (state, action: PayloadAction<string>) => {
      state.data = state.data.filter((c) => c._id !== action.payload);
    },
  },
});

export const {
  setContacts,
  setLoading,
  setError,
  addContact,
  updateContact,
  deleteContact,
} = contactsSlice.actions;

export default contactsSlice.reducer;
