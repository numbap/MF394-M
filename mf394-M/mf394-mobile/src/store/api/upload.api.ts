/**
 * Upload API
 *
 * RTK Query API for image upload to S3 via the backend.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { API_BASE_URL } from '../../utils/constants';

export interface UploadRequest {
  uri: string;
  type?: string;
  source?: string;
}

export interface UploadResponse {
  url: string;
}

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

export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery,
  endpoints: (builder) => ({
    uploadImage: builder.mutation<UploadResponse, UploadRequest>({
      queryFn: async ({ uri, type = 'contact-photo', source = 'app' }, _api, _extra, baseQueryFn) => {
        try {
          // Convert local image URI to base64
          const response = await fetch(uri);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // strip data:image/...;base64, prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const result = await baseQueryFn({
            url: '/upload',
            method: 'POST',
            body: {
              image: base64,
              metadata: { type, source },
            },
          });

          return result as any;
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadApi;
