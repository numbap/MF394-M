/**
 * Auth API
 *
 * RTK Query API for authentication operations against the live API.
 * Uses single JWT token (not access/refresh pair).
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User } from '../slices/auth.slice';
import type { Contact } from './contacts.api';

export interface LoginResponse {
  token: string;
  user: {
    _id?: string;
    id?: string;
    email: string;
    name: string;
    image?: string;
  };
}

export interface UserDataResponse {
  id: string;
  name: string;
  email: string;
  image?: string;
  contacts: Contact[];
  managedTags: string[];
  managedCategories?: string[];
  stats?: any;
  vcard?: any;
}

const API_BASE_URL =
  (process.env as any).API_DOMAIN ||
  (process.env as any).API_BASE_URL ||
  'https://ummyou.com';

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers, { getState }) => {
    headers.set('Content-Type', 'application/json');
    const state = getState() as any;
    const token = state.auth?.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Login with Google ID token
    login: builder.mutation<LoginResponse, { idToken: string }>({
      query: ({ idToken }) => ({
        url: '/auth/mobile-login',
        method: 'POST',
        body: { idToken },
      }),
      invalidatesTags: ['User'],
    }),

    // Get full user data including contacts and tags
    getUser: builder.query<UserDataResponse, void>({
      query: () => '/user',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetUserQuery,
} = authApi;
