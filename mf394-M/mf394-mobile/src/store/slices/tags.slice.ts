/**
 * Tags Redux Slice
 *
 * Manages global tag list (default + custom tags).
 * Initializes with AVAILABLE_TAGS, allows adding custom tags.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { AVAILABLE_TAGS } from '../../constants';

interface TagsState {
  tags: string[];
}

const initialState: TagsState = {
  tags: [...AVAILABLE_TAGS], // Initialize with default tags
};

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    // Initialize/set tags (e.g., after loading from storage)
    initializeTags: (state, action: PayloadAction<string[] | undefined>) => {
      state.tags = action.payload || [...AVAILABLE_TAGS];
    },

    // Add a new tag
    addTag: (state, action: PayloadAction<string>) => {
      const normalized = action.payload
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-'); // Replace spaces with hyphens

      // Prevent duplicates (case-insensitive)
      const exists = state.tags.some(tag => tag.toLowerCase() === normalized);
      if (!exists && normalized.length > 0) {
        state.tags.push(normalized);
      }
    },

    // Delete a tag
    deleteTag: (state, action: PayloadAction<string>) => {
      state.tags = state.tags.filter(tag => tag !== action.payload);
    },

    // Set all tags (replace entire list)
    setTags: (state, action: PayloadAction<string[]>) => {
      state.tags = action.payload;
    },
  },
});

export const {
  initializeTags,
  addTag,
  deleteTag,
  setTags,
} = tagsSlice.actions;

// Selectors
export const selectAllTags = (state: RootState): string[] => {
  return state.tags?.tags || [...AVAILABLE_TAGS];
};

export const selectTagExists = (tagName: string) => (state: RootState): boolean => {
  const tags = state.tags?.tags || [];
  return tags.some(tag => tag.toLowerCase() === tagName.toLowerCase());
};

/**
 * Check if a tag is a default (system) tag from AVAILABLE_TAGS
 */
export const isDefaultTag = (tagName: string): boolean => {
  return AVAILABLE_TAGS.includes(tagName);
};

export default tagsSlice.reducer;
