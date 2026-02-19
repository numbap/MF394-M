/**
 * Filters Slice
 *
 * Manages category and tag filter selections shared across Contacts and Quiz screens.
 * Persists to AsyncStorage so filters are remembered between app sessions.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StorageService } from '../../services/storage.service';

interface FiltersState {
  selectedCategories: string[];
  selectedTags: string[];
  isLoaded: boolean; // Track if we've loaded from storage
}

const initialState: FiltersState = {
  selectedCategories: [],
  selectedTags: [],
  isLoaded: false,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
      // Clear tags when categories change
      state.selectedTags = [];
      // Spread to plain arrays — immer draft proxies are revoked after reducer returns
      StorageService.saveFilters({
        categories: [...action.payload],
        tags: [],
      });
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
      // Spread to plain arrays — immer draft proxies are revoked after reducer returns
      StorageService.saveFilters({
        categories: [...state.selectedCategories],
        tags: [],
      });
    },

    setTags: (state, action: PayloadAction<string[]>) => {
      state.selectedTags = action.payload;
      // Spread to plain arrays — immer draft proxies are revoked after reducer returns
      StorageService.saveFilters({
        categories: [...state.selectedCategories],
        tags: [...action.payload],
      });
    },

    toggleTag: (state, action: PayloadAction<string>) => {
      const tag = action.payload;
      if (state.selectedTags.includes(tag)) {
        state.selectedTags = state.selectedTags.filter((t) => t !== tag);
      } else {
        state.selectedTags.push(tag);
      }
      // Spread to plain arrays — immer draft proxies are revoked after reducer returns
      StorageService.saveFilters({
        categories: [...state.selectedCategories],
        tags: [...state.selectedTags],
      });
    },

    clearFilters: (state) => {
      state.selectedCategories = [];
      state.selectedTags = [];
      // Persist to storage
      StorageService.saveFilters({
        categories: [],
        tags: [],
      });
    },

    // Load filters from storage on app start
    restoreFilters: (state, action: PayloadAction<{ categories: string[]; tags: string[] }>) => {
      state.selectedCategories = action.payload.categories;
      state.selectedTags = action.payload.tags;
      state.isLoaded = true;
    },

    markFiltersLoaded: (state) => {
      state.isLoaded = true;
    },
  },
});

export const {
  setCategories,
  toggleCategory,
  setTags,
  toggleTag,
  clearFilters,
  restoreFilters,
  markFiltersLoaded,
} = filtersSlice.actions;

export default filtersSlice.reducer;

// Selectors
export const selectSelectedCategories = (state: { filters: FiltersState }) =>
  state.filters.selectedCategories;

export const selectSelectedTags = (state: { filters: FiltersState }) =>
  state.filters.selectedTags;

export const selectFiltersLoaded = (state: { filters: FiltersState }) =>
  state.filters.isLoaded;
