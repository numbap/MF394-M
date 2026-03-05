/**
 * Filters Slice
 *
 * Manages category and tag filter selections shared across Contacts and Quiz screens.
 * Filter state resets on every session (no persistence) so users always start with
 * zero categories selected after login or page refresh.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  selectedCategories: string[];
  selectedTags: string[];
}

const initialState: FiltersState = {
  selectedCategories: [],
  selectedTags: [],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
      // Clear tags when categories change
      state.selectedTags = [];
    },

    toggleCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload;
      if (state.selectedCategories.includes(category)) {
        state.selectedCategories = state.selectedCategories.filter((c) => c !== category);
      } else {
        state.selectedCategories.push(category);
      }
      // Clear tags when categories change
      state.selectedTags = [];
    },

    setTags: (state, action: PayloadAction<string[]>) => {
      state.selectedTags = action.payload;
    },

    toggleTag: (state, action: PayloadAction<string>) => {
      const tag = action.payload;
      if (state.selectedTags.includes(tag)) {
        state.selectedTags = state.selectedTags.filter((t) => t !== tag);
      } else {
        state.selectedTags.push(tag);
      }
    },

    clearFilters: (state) => {
      state.selectedCategories = [];
      state.selectedTags = [];
    },
  },
});

export const {
  setCategories,
  toggleCategory,
  setTags,
  toggleTag,
  clearFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;

// Selectors
export const selectSelectedCategories = (state: { filters: FiltersState }) =>
  state.filters.selectedCategories;

export const selectSelectedTags = (state: { filters: FiltersState }) =>
  state.filters.selectedTags;
