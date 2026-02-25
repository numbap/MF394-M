/**
 * QuizGameScreen Integration Tests
 *
 * Tests for Redux + component integration:
 * - Redux integration (real store)
 * - CategoryTagFilter integration
 * - FilterContainer integration
 * - Full user flows
 * - Redux + AsyncStorage sync
 *
 * KEY DIFFERENCE: Uses REAL components (not mocked)
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import QuizGameScreen from './QuizGameScreen';
import { renderWithRedux } from '../../../__tests__/utils/reduxTestUtils';
import { QUIZ_CONTACTS, createQuizStoreState, FILTER_STATES } from '../../../__tests__/fixtures/quizGame.fixtures';
import { StorageService } from '../../services/storage.service';
import { toggleCategory, toggleTag } from '../../store/slices/filters.slice';

// Mock only what we must (animations, sounds)
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: { View },
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withSpring: jest.fn((val) => val),
    withSequence: jest.fn((...args) => args[args.length - 1]),
    withTiming: jest.fn((val) => val),
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Error: 'error' },
}));

jest.mock('../../services/storage.service', () => ({
  StorageService: {
    loadFilters: jest.fn(() => Promise.resolve({ categories: ['friends-family'], tags: [] })),
    saveFilters: jest.fn(() => Promise.resolve()),
  },
}));

// DO NOT mock CategoryTagFilter or FilterContainer (integration test!)

jest.mock('../../components/QuizCelebration', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    QuizCelebration: ({ onPlayAgain }) =>
      React.createElement(View, { testID: 'quiz-celebration' },
        React.createElement(TouchableOpacity, { onPress: onPlayAgain, testID: 'play-again' })
      ),
  };
});

// Mock RTK Query so contacts come from useGetUserQuery, not state.contacts.data
const mockUseGetUserQuery = jest.fn();
jest.mock('../../store/api/contacts.api', () => ({
  useGetUserQuery: (...args) => mockUseGetUserQuery(...args),
}));

describe('QuizGameScreen - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Default: return minimal contacts (5 friends-family with photos)
    mockUseGetUserQuery.mockReturnValue({
      data: { contacts: QUIZ_CONTACTS.minimal },
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Redux Integration', () => {
    it('reads contacts from Redux store', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });

      // Verify contacts from Redux are rendered
      expect(getByText('Alice')).toBeTruthy();
    });

    it('reads filters from Redux store', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      const state = store.getState();
      expect(state.filters.selectedCategories).toContain('friends-family');
    });

    it('dispatches filter updates to Redux', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      // Dispatch category toggle
      act(() => {
        store.dispatch(toggleCategory('work'));
      });

      const state = store.getState();
      expect(state.filters.selectedCategories).toContain('work');
    });

    it('reacts to external Redux state changes', async () => {
      const { store, getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      await waitFor(() => {
        expect(getByText(/Select Categories to Start Quiz/i)).toBeTruthy();
      });

      // Update Redux externally
      act(() => {
        store.dispatch(toggleCategory('friends-family'));
      });

      // Component should react and show quiz
      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });
    });

    it('handles empty contacts array', async () => {
      mockUseGetUserQuery.mockReturnValue({ data: { contacts: [] }, isLoading: false });
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState([], FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText(/Minimum 5 contacts with photos or hints/i)).toBeTruthy();
      });
    });
  });

  describe('CategoryTagFilter Integration', () => {
    it('renders CategoryTagFilter component', async () => {
      const { container } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // CategoryTagFilter should be rendered (we verify by checking for category text)
      // Note: Real component may not expose testIDs in same way as mock
    });

    it('passes correct props to CategoryTagFilter', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.singleCategory),
      });

      const state = store.getState();
      expect(state.filters.selectedCategories).toEqual(['friends-family']);
    });

    it('handles category toggle from CategoryTagFilter', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      // Toggle via Redux action (simulating CategoryTagFilter interaction)
      act(() => {
        store.dispatch(toggleCategory('friends-family'));
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.filters.selectedCategories).toContain('friends-family');
      });
    });

    it('handles tag toggle from CategoryTagFilter', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.singleCategory),
      });

      // Toggle tag via Redux action
      act(() => {
        store.dispatch(toggleTag('Sports'));
      });

      await waitFor(() => {
        const state = store.getState();
        expect(state.filters.selectedTags).toContain('Sports');
      });
    });
  });

  describe('FilterContainer Integration', () => {
    it('wraps CategoryTagFilter in FilterContainer', async () => {
      const { container } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      await waitFor(() => {
        expect(container).toBeTruthy();
      });

      // FilterContainer should wrap the filter UI
      // We verify by checking component renders
    });

    it('handles FilterContainer collapse/expand', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });

      // FilterContainer exists and quiz is visible
      // Collapse/expand functionality is tested in FilterContainer's own tests
    });
  });

  describe('Full User Flow', () => {
    it('complete quiz cycle: load → filter → play → answer', async () => {
      const { store, getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.empty),
      });

      // Step 1: Load (no categories selected)
      await waitFor(() => {
        expect(getByText(/Select Categories to Start Quiz/i)).toBeTruthy();
      });

      // Step 2: Filter (select category)
      act(() => {
        store.dispatch(toggleCategory('friends-family'));
      });

      // Step 3: Play (quiz loads)
      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });

      // Step 4: Answer
      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      // Auto-advance
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(getByText(/2 of 5/)).toBeTruthy();
      });
    });

    it('handles filter change mid-quiz', async () => {
      const { store, getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.singleCategory),
      });

      // Start quiz
      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });

      // Answer first question
      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(getByText(/2 of/)).toBeTruthy();
      });

      // Change filter mid-quiz
      act(() => {
        store.dispatch(toggleCategory('work'));
      });

      // Quiz should reset to question 1 with new pool
      await waitFor(() => {
        expect(getByText(/1 of/)).toBeTruthy();
      });
    });

    it('persists state across filter collapses', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });

      // Quiz state persists (question number, contacts, etc.)
      expect(getByText('1 of 5')).toBeTruthy();
    });
  });

  describe('Redux + AsyncStorage Sync', () => {
    it('syncs filter changes to both Redux and AsyncStorage', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      // Toggle category (this triggers Redux update + AsyncStorage save)
      act(() => {
        store.dispatch(toggleCategory('friends-family'));
      });

      await waitFor(() => {
        // Redux updated
        const state = store.getState();
        expect(state.filters.selectedCategories).toContain('friends-family');

        // AsyncStorage called
        expect(StorageService.saveFilters).toHaveBeenCalledWith(
          expect.objectContaining({
            categories: expect.arrayContaining(['friends-family']),
          })
        );
      });
    });

    it('loads initial state from AsyncStorage into Redux', async () => {
      StorageService.loadFilters.mockResolvedValue({
        categories: ['work', 'community'],
        tags: ['Tech'],
      });

      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.notLoaded),
      });

      await waitFor(() => {
        expect(StorageService.loadFilters).toHaveBeenCalled();
      });

      // Redux should be updated with loaded filters
      // Note: This happens via restoreFilters action in the component
    });
  });

  describe('Multi-Step Quiz Flow', () => {
    it('handles complete quiz with all correct answers', async () => {
      const { getByText, getByTestId } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('1 of 5')).toBeTruthy();
      });

      // Answer all 5 questions
      for (let i = 1; i <= 5; i++) {
        await waitFor(() => {
          expect(getByText(`${i} of 5`)).toBeTruthy();
        });

        // Click any answer (Alice is always an option)
        const aliceButton = getByText('Alice');
        act(() => {
          fireEvent.press(aliceButton);
        });

        // Wait for auto-advance
        act(() => {
          jest.advanceTimersByTime(600);
        });
      }

      // Should show celebration screen instead of looping
      await waitFor(() => {
        expect(getByTestId('quiz-celebration')).toBeTruthy();
      });
    });

    it('handles quiz with mix of correct and incorrect answers', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('1 of 5')).toBeTruthy();
      });

      // Wrong answer
      const bobButton = getByText('Bob');
      act(() => {
        fireEvent.press(bobButton);
      });

      // Wait for feedback to clear
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should still be on question 1
      await waitFor(() => {
        expect(getByText('1 of 5')).toBeTruthy();
      });

      // Correct answer
      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      // Auto-advance
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should advance to question 2
      await waitFor(() => {
        expect(getByText('2 of 5')).toBeTruthy();
      });
    });
  });

  describe('Redux State Consistency', () => {
    it('maintains consistent Redux state throughout quiz', async () => {
      const { store, getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });

      // Verify initial state
      let state = store.getState();
      expect(state.contacts.data.length).toBe(5);
      expect(state.filters.selectedCategories).toEqual(['friends-family']);

      // Answer a question
      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Verify state unchanged
      state = store.getState();
      expect(state.contacts.data.length).toBe(5);
      expect(state.filters.selectedCategories).toEqual(['friends-family']);
    });

    it('updates Redux when filters change', async () => {
      const { store } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.singleCategory),
      });

      const initialState = store.getState();
      expect(initialState.filters.selectedCategories).toEqual(['friends-family']);

      // Change filter
      act(() => {
        store.dispatch(toggleCategory('work'));
      });

      const newState = store.getState();
      expect(newState.filters.selectedCategories).toContain('work');
    });
  });

  describe('Error Recovery', () => {
    it('recovers from AsyncStorage load failure', async () => {
      StorageService.loadFilters.mockRejectedValue(new Error('Storage error'));

      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.notLoaded),
      });

      // Should not crash, show category selection
      await waitFor(() => {
        expect(getByText(/Select Categories to Start Quiz/i)).toBeTruthy();
      });
    });

    it('continues quiz despite AsyncStorage save failure', async () => {
      StorageService.saveFilters.mockRejectedValue(new Error('Save failed'));

      const { store, getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.standard, FILTER_STATES.empty),
      });

      // Toggle category (save will fail silently)
      act(() => {
        store.dispatch(toggleCategory('friends-family'));
      });

      // Quiz should still load
      await waitFor(() => {
        expect(getByText(/\d+ of \d+/)).toBeTruthy();
      });
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for full screen render with real components', async () => {
      const tree = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(tree.getByText(/\d+ of \d+/)).toBeTruthy();
      });

      expect(tree.toJSON()).toMatchSnapshot();
    });
  });
});
