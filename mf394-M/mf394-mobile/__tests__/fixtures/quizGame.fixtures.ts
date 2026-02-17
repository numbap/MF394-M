/**
 * Quiz Game Test Fixtures
 *
 * Centralized test data for QuizGameScreen tests
 */

import type { RootState } from '../../src/store';

/**
 * Contact factory function
 */
export function createMockContact(overrides: Partial<any> = {}) {
  const id = overrides._id || `contact_${Date.now()}_${Math.random()}`;
  return {
    _id: id,
    name: overrides.name || 'Test Contact',
    photo: overrides.photo !== undefined ? overrides.photo : 'data:image/jpeg;base64,test',
    category: overrides.category || 'friends-family',
    groups: overrides.groups || [],
    created: overrides.created || Date.now(),
    edited: overrides.edited || Date.now(),
    ...overrides,
  };
}

/**
 * Preset contact arrays for different test scenarios
 */
export const QUIZ_CONTACTS = {
  // Exactly 5 contacts (minimum for quiz)
  minimal: [
    createMockContact({ _id: '1', name: 'Alice', photo: 'data:image/jpeg;base64,alice' }),
    createMockContact({ _id: '2', name: 'Bob', photo: 'data:image/jpeg;base64,bob' }),
    createMockContact({ _id: '3', name: 'Charlie', photo: 'data:image/jpeg;base64,charlie' }),
    createMockContact({ _id: '4', name: 'David', photo: 'data:image/jpeg;base64,david' }),
    createMockContact({ _id: '5', name: 'Eve', photo: 'data:image/jpeg;base64,eve' }),
  ],

  // Standard set with 10 contacts (at least 5 in friends-family for filtering tests)
  standard: [
    createMockContact({ _id: '1', name: 'Alice', photo: 'data:image/jpeg;base64,alice', category: 'friends-family' }),
    createMockContact({ _id: '2', name: 'Bob', photo: 'data:image/jpeg;base64,bob', category: 'friends-family' }),
    createMockContact({ _id: '3', name: 'Charlie', photo: 'data:image/jpeg;base64,charlie', category: 'friends-family' }),
    createMockContact({ _id: '4', name: 'David', photo: 'data:image/jpeg;base64,david', category: 'friends-family' }),
    createMockContact({ _id: '5', name: 'Eve', photo: 'data:image/jpeg;base64,eve', category: 'friends-family' }),
    createMockContact({ _id: '6', name: 'Frank', photo: 'data:image/jpeg;base64,frank', category: 'friends-family', groups: ['Sports'] }),
    createMockContact({ _id: '7', name: 'Grace', photo: 'data:image/jpeg;base64,grace', category: 'friends-family', groups: ['Music'] }),
    createMockContact({ _id: '8', name: 'Henry', photo: 'data:image/jpeg;base64,henry', category: 'work', groups: ['Tech'] }),
    createMockContact({ _id: '9', name: 'Iris', photo: 'data:image/jpeg;base64,iris', category: 'work' }),
    createMockContact({ _id: '10', name: 'Jack', photo: 'data:image/jpeg;base64,jack', category: 'work' }),
  ],

  // Mixed set with some contacts without photos
  withoutPhotos: [
    createMockContact({ _id: '1', name: 'Alice', photo: 'data:image/jpeg;base64,alice' }),
    createMockContact({ _id: '2', name: 'Bob', photo: '' }),
    createMockContact({ _id: '3', name: 'Charlie', photo: 'data:image/jpeg;base64,charlie' }),
    createMockContact({ _id: '4', name: 'David', photo: '   ' }),
    createMockContact({ _id: '5', name: 'Eve', photo: 'data:image/jpeg;base64,eve' }),
    createMockContact({ _id: '6', name: 'Frank', photo: 'data:image/jpeg;base64,frank' }),
    createMockContact({ _id: '7', name: 'Grace', photo: null }),
    createMockContact({ _id: '8', name: 'Henry', photo: 'data:image/jpeg;base64,henry' }),
  ],

  // All contacts in single category
  singleCategory: [
    createMockContact({ _id: '1', name: 'Alice', category: 'friends-family' }),
    createMockContact({ _id: '2', name: 'Bob', category: 'friends-family' }),
    createMockContact({ _id: '3', name: 'Charlie', category: 'friends-family' }),
    createMockContact({ _id: '4', name: 'David', category: 'friends-family' }),
    createMockContact({ _id: '5', name: 'Eve', category: 'friends-family' }),
  ],

  // Large contact pool (100+ contacts)
  large: Array.from({ length: 100 }, (_, i) =>
    createMockContact({
      _id: `${i + 1}`,
      name: `Person ${i + 1}`,
      photo: `data:image/jpeg;base64,person${i + 1}`,
      category: ['friends-family', 'work', 'community', 'goals-hobbies', 'miscellaneous'][i % 5],
    })
  ),
};

/**
 * Preset filter configurations
 */
export const FILTER_STATES = {
  // No filters selected (initial state)
  empty: {
    selectedCategories: [],
    selectedTags: [],
    isLoaded: true,
  },

  // Single category selected
  singleCategory: {
    selectedCategories: ['friends-family'],
    selectedTags: [],
    isLoaded: true,
  },

  // Multiple categories selected
  multiCategory: {
    selectedCategories: ['friends-family', 'work'],
    selectedTags: [],
    isLoaded: true,
  },

  // Categories + tags selected
  withTags: {
    selectedCategories: ['friends-family'],
    selectedTags: ['Sports', 'Music'],
    isLoaded: true,
  },

  // Filters not yet loaded from storage
  notLoaded: {
    selectedCategories: [],
    selectedTags: [],
    isLoaded: false,
  },
};

/**
 * Helper to create preloaded Redux state for quiz tests
 */
export function createQuizStoreState(
  contacts: any[] = QUIZ_CONTACTS.standard,
  filterState = FILTER_STATES.singleCategory
): Partial<RootState> {
  return {
    contacts: {
      data: contacts,
      loading: false,
      error: null,
    },
    filters: filterState,
    auth: {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    },
    ui: {
      toasts: [],
    },
    tags: {
      tags: ['Sports', 'Music', 'Tech'],
    },
  } as Partial<RootState>;
}
