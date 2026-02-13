/**
 * Contacts API
 *
 * RTK Query API for contact CRUD operations.
 * Handles automatic caching, invalidation, and optimistic updates.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const contactsApi = createApi({
  reducerPath: 'contactsApi',
  baseQuery,
  tagTypes: ['Contact'],
  endpoints: (builder) => ({
    // Get all contacts with pagination
    getContacts: builder.query<
      ContactsResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: ({ page = 1, limit = 20, search = '' }) =>
        `/contacts?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      providesTags: ['Contact'],
    }),

    // Get single contact
    getContactById: builder.query<Contact, string>({
      query: (id) => `/contacts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Contact', id }],
    }),

    // Create contact
    createContact: builder.mutation<Contact, ContactInput>({
      query: (data) => ({
        url: '/contacts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Contact'],
    }),

    // Update contact
    updateContact: builder.mutation<Contact, { id: string; data: Partial<ContactInput> }>({
      query: ({ id, data }) => ({
        url: `/contacts/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Contact', id }, 'Contact'],
    }),

    // Delete contact
    deleteContact: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Contact', id }, 'Contact'],
    }),

    // Batch delete contacts
    deleteContacts: builder.mutation<void, string[]>({
      query: (ids) => ({
        url: '/contacts/batch/delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: ['Contact'],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactByIdQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useDeleteContactsMutation,
} = contactsApi;
