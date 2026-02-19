/**
 * Contacts API
 *
 * RTK Query API for contact CRUD operations against the live API.
 * Handles automatic caching and invalidation.
 * Category format is mapped between app (kebab-case) and API (Title Case).
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { mapCategoryToAPI, mapCategoryFromAPI } from '../../utils/categoryMapper';
import { API_BASE_URL } from '../../utils/constants';

export interface Contact {
  _id: string;
  name: string;
  hint?: string;
  photo?: string; // S3 URL
  summary?: string;
  category: 'friends-family' | 'community' | 'work' | 'goals-hobbies' | 'miscellaneous';
  groups: string[]; // Tag names
  created: number;
  edited: number;
}

export interface ContactInput {
  name: string;
  hint?: string;
  summary?: string;
  category: 'friends-family' | 'community' | 'work' | 'goals-hobbies' | 'miscellaneous';
  groups?: string[]; // Tag names
  photo?: string; // S3 URL
}

// API-side contact shape (Title Case category)
interface APIContact {
  _id: string;
  name: string;
  hint?: string;
  photo?: string;
  summary?: string;
  category: string; // Title Case
  groups: string[];
  created: number;
  edited: number;
}

const transformFromAPI = (contact: APIContact): Contact => ({
  ...contact,
  category: mapCategoryFromAPI(contact.category) as Contact['category'],
});

const transformToAPI = (contact: ContactInput) => ({
  ...contact,
  category: mapCategoryToAPI(contact.category),
});

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const contactsApi = createApi({
  reducerPath: 'contactsApi',
  baseQuery,
  tagTypes: ['Contact', 'User'],
  endpoints: (builder) => ({
    // Get full user data (contacts + tags) - primary data load
    getUser: builder.query<{
      id: string;
      name: string;
      email: string;
      image?: string;
      contacts: Contact[];
      managedTags: string[];
    }, void>({
      query: () => '/user',
      transformResponse: (response: any) => ({
        ...response,
        contacts: (response.contacts || []).map(transformFromAPI),
      }),
      providesTags: ['User', 'Contact'],
    }),

    // Get single contact
    getContactById: builder.query<Contact, string>({
      query: (id) => `/contacts/${id}`,
      transformResponse: (response: APIContact) => transformFromAPI(response),
      providesTags: (result) => (result ? [{ type: 'Contact', id: result._id }] : ['Contact']),
    }),

    // Create or update contact (API uses PUT for both)
    createContact: builder.mutation<Contact, ContactInput>({
      query: (data) => ({
        url: '/contacts',
        method: 'PUT',
        body: { contact: transformToAPI(data) },
      }),
      transformResponse: (response: { message: string; contact: APIContact }) =>
        transformFromAPI(response.contact),
      invalidatesTags: ['Contact', 'User'],
    }),

    // Update contact
    updateContact: builder.mutation<{ message: string }, { id: string; data: Partial<ContactInput> }>({
      query: ({ id, data }) => ({
        url: '/contacts',
        method: 'PUT',
        body: { contact: { _id: id, ...transformToAPI(data as ContactInput) } },
      }),
      invalidatesTags: ['Contact', 'User'],
    }),

    // Delete contact (query param, not path param)
    deleteContact: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contacts?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Contact', 'User'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetContactByIdQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = contactsApi;
