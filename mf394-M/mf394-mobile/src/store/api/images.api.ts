/**
 * Images API
 *
 * RTK Query API for image upload and management.
 * Handles file uploads with automatic caching and optimization.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export interface Image {
  id: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  uploadedAt: number;
  contactId?: string;
  metadata?: Record<string, any>;
}

export interface UploadResponse {
  image: Image;
  success: boolean;
}

export interface ImagesResponse {
  images: Image[];
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
    // Don't set Content-Type for multipart/form-data
    return headers;
  },
});

export const imagesApi = createApi({
  reducerPath: 'imagesApi',
  baseQuery,
  tagTypes: ['Image'],
  endpoints: (builder) => ({
    // Get all images
    getImages: builder.query<ImagesResponse, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 }) => `/images?page=${page}&limit=${limit}`,
      providesTags: ['Image'],
    }),

    // Get contact images
    getContactImages: builder.query<Image[], string>({
      query: (contactId) => `/images/contact/${contactId}`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Image' as const, id })), 'Image']
          : ['Image'],
    }),

    // Get single image
    getImageById: builder.query<Image, string>({
      query: (id) => `/images/${id}`,
      providesTags: (result, error, id) => [{ type: 'Image', id }],
    }),

    // Upload image
    uploadImage: builder.mutation<
      UploadResponse,
      { file: File; contactId?: string; metadata?: Record<string, any> }
    >({
      query: ({ file, contactId, metadata }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (contactId) {
          formData.append('contactId', contactId);
        }
        if (metadata) {
          formData.append('metadata', JSON.stringify(metadata));
        }
        return {
          url: '/images/upload',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { contactId }) => {
        const tags: any[] = ['Image'];
        if (contactId) {
          tags.push({ type: 'Image', id: contactId });
        }
        return tags;
      },
    }),

    // Delete image
    deleteImage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/images/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Image', id }, 'Image'],
    }),

    // Batch delete images
    deleteImages: builder.mutation<void, string[]>({
      query: (ids) => ({
        url: '/images/batch/delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: ['Image'],
    }),

    // Update image metadata
    updateImage: builder.mutation<
      Image,
      { id: string; metadata?: Record<string, any> }
    >({
      query: ({ id, metadata }) => ({
        url: `/images/${id}`,
        method: 'PATCH',
        body: { metadata },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Image', id }, 'Image'],
    }),
  }),
});

export const {
  useGetImagesQuery,
  useGetContactImagesQuery,
  useGetImageByIdQuery,
  useUploadImageMutation,
  useDeleteImageMutation,
  useDeleteImagesMutation,
  useUpdateImageMutation,
} = imagesApi;
