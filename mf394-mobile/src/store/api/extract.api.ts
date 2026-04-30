/**
 * Extract API
 *
 * RTK Query API for screenshot-based contact extraction via Gemini Vision.
 * Sends a base64-encoded screenshot to the backend, which returns
 * structured data about visible people (names, titles, orgs, face regions).
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { API_BASE_URL, API_TIMEOUT } from '../../utils/constants';

export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedPerson {
  name: string;
  title?: string | null;
  organization?: string | null;
  faceRegion?: FaceRegion | null;
}

export interface ExtractResponse {
  people: ExtractedPerson[];
}

export interface ExtractRequest {
  image: string; // base64-encoded image
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
    const state = getState() as RootState;
    const token = state.auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const extractApi = createApi({
  reducerPath: 'extractApi',
  baseQuery,
  endpoints: (builder) => ({
    extractContacts: builder.mutation<ExtractResponse, ExtractRequest>({
      query: (body) => ({
        url: '/extract-contacts',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useExtractContactsMutation } = extractApi;
