/**
 * Auth API
 *
 * RTK Query API for authentication operations against the live API.
 * Uses single JWT token (not access/refresh pair).
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User } from '../slices/auth.slice';
import type { Contact } from './contacts.api';
import { API_BASE_URL, API_TIMEOUT } from '../../utils/constants';

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
  createdAt?: string;
  contacts: Contact[];
  managedTags: string[];
  managedCategories?: string[];
  stats?: any;
  vcard?: any;
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);
  try {
    return await fetch(input as RequestInfo, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  fetchFn: fetchWithTimeout,
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
    // Login with Google ID token (native)
    login: builder.mutation<LoginResponse, { idToken: string }>({
      query: ({ idToken }) => ({
        url: '/auth/provider-login',
        method: 'POST',
        body: { idToken },
      }),
      invalidatesTags: ['User'],
    }),

    // Login with Apple ID token (iOS native)
    appleLogin: builder.mutation<LoginResponse, { idToken: string; provider: 'apple'; name?: { firstName?: string; lastName?: string } | null }>({
      query: (body) => ({
        url: '/auth/provider-login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    // Get full user data including contacts and tags
    getUser: builder.query<UserDataResponse, void>({
      query: () => '/user',
      providesTags: ['User'],
    }),

    // Delete user account permanently
    deleteAccount: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/account',
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useAppleLoginMutation,
  useGetUserQuery,
  useDeleteAccountMutation,
} = authApi;
