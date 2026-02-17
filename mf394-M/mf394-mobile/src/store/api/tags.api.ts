/**
 * Tags API
 *
 * RTK Query API for tag management operations.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface Tag {
  id: string;
  name: string;
  created?: number;
  order?: number;
}

const API_BASE_URL =
  (process.env as any).API_DOMAIN ||
  (process.env as any).API_BASE_URL ||
  'https://ummyou.com';

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

export const tagsApi = createApi({
  reducerPath: 'tagsApi',
  baseQuery,
  tagTypes: ['Tag'],
  endpoints: (builder) => ({
    getTags: builder.query<Tag[], void>({
      query: () => '/tags',
      transformResponse: (response: any) => response.tags || response || [],
      providesTags: ['Tag'],
    }),

    createTag: builder.mutation<Tag, string>({
      query: (name) => ({
        url: '/tags',
        method: 'POST',
        body: { name },
      }),
      transformResponse: (response: any) => response.tag || response,
      invalidatesTags: ['Tag'],
    }),

    deleteTag: builder.mutation<{ message: string; affectedContacts: number }, string>({
      query: (id) => ({
        url: `/tags?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tag'],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
} = tagsApi;
