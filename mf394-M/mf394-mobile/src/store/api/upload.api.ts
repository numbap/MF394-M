/**
 * Upload API
 *
 * RTK Query API for image upload to S3 via the backend.
 *
 * Request body shape (matches server expectation):
 *   { fileName: string, fileType: string, fileContent: string (base64) }
 *
 * Platform handling:
 *   - Web data URL  → extract base64 from the URI directly (no fetch needed)
 *   - Web file/http → fetch blob + FileReader
 *   - Native        → expo-image-manipulator with base64: true
 */

import { Platform } from 'react-native';
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

interface Base64Result {
  base64: string;
  mimeType: string;
  fileName: string;
}

export async function getBase64FromUri(uri: string): Promise<Base64Result> {
  // Data URL (web canvas output) — extract base64 directly, no network call needed
  if (uri.startsWith('data:')) {
    const [header, base64] = uri.split(',');
    const mimeType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    return { base64, mimeType, fileName: `upload.${ext}` };
  }

  if (Platform.OS !== 'web') {
    // Native: use expo-image-manipulator to read file as base64
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ImageManipulator } = require('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 0.9,
      format: 'jpeg',
      base64: true,
    });
    return {
      base64: result.base64 as string,
      mimeType: 'image/jpeg',
      fileName: 'upload.jpg',
    };
  }

  // Web file:// or remote URL — fetch then read via FileReader
  const response = await fetch(uri);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const mimeType = blob.type || 'image/jpeg';
  const ext = mimeType.split('/')[1] || 'jpg';
  return { base64, mimeType, fileName: `upload.${ext}` };
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
      queryFn: async ({ uri }, _api, _extra, baseQueryFn) => {
        try {
          const { base64, mimeType, fileName } = await getBase64FromUri(uri);

          const result = await baseQueryFn({
            url: '/upload',
            method: 'POST',
            body: {
              fileName,
              fileType: mimeType,
              fileContent: base64,
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
