/**
 * Auth API
 *
 * RTK Query API for authentication operations.
 * Handles login, logout, token refresh, and user profile updates.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User } from '../slices/auth.slice';

export interface LoginRequest {
  provider: 'google' | 'apple' | 'facebook';
  idToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // Login with social provider
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Logout
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // Refresh access token
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: ({ refreshToken }) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),

    // Get current user profile
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Update user profile
    updateProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (data) => ({
        url: '/auth/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Verify session (for restoring from storage)
    verifySession: builder.query<User | null, void>({
      query: () => '/auth/verify',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useVerifySessionQuery,
} = authApi;
