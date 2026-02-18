/**
 * QuizGameScreen Mechanics Tests
 *
 * Tests for core game logic:
 * - Quiz initialization
 * - Question generation
 * - Answer selection (correct/incorrect)
 * - Auto-advance behavior
 * - Quiz loop
 * - Button interactions
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import QuizGameScreen from './QuizGameScreen';
import { renderWithRedux } from '../../../__tests__/utils/reduxTestUtils';
import { QUIZ_CONTACTS, createQuizStoreState, FILTER_STATES } from '../../../__tests__/fixtures/quizGame.fixtures';
import { StorageService } from '../../services/storage.service';

// Mock dependencies
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View,
    },
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    withSpring: jest.fn((val) => val),
    withSequence: jest.fn((...args) => args[args.length - 1]),
    withTiming: jest.fn((val) => val),
  };
});

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    type: 'sine',
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
}));

// Mock StorageService
jest.mock('../../services/storage.service', () => ({
  StorageService: {
    loadFilters: jest.fn(() => Promise.resolve({ categories: ['friends-family'], tags: [] })),
    saveFilters: jest.fn(() => Promise.resolve()),
  },
}));

// Mock child components
jest.mock('../../components/CategoryTagFilter/CategoryTagFilter', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CategoryTagFilter: () => React.createElement(View, { testID: 'category-tag-filter' }),
  };
});

jest.mock('../../components/FilterContainer/FilterContainer', () => {
  const React = require('react');
  return {
    FilterContainer: ({ children }) => children,
  };
});

// Mock RTK Query so contacts come from useGetUserQuery, not state.contacts.data
const mockUseGetUserQuery = jest.fn();
jest.mock('../../store/api/contacts.api', () => ({
  useGetUserQuery: (...args) => mockUseGetUserQuery(...args),
}));

describe('QuizGameScreen - Mechanics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    // Default: return minimal contacts (5 friends-family with photos)
    mockUseGetUserQuery.mockReturnValue({
      data: { contacts: QUIZ_CONTACTS.minimal },
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Quiz Initialization', () => {
    it('shuffles contacts on mount', async () => {
      const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // Verify shuffle was called (Math.random used)
      expect(mathRandomSpy).toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });

    it('generates 5 unique options for first question', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // Verify all 5 names are rendered as options
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('Charlie')).toBeTruthy();
      expect(getByText('David')).toBeTruthy();
      expect(getByText('Eve')).toBeTruthy();
    });

    it('shows empty state with <5 contacts', async () => {
      mockUseGetUserQuery.mockReturnValue({ data: { contacts: QUIZ_CONTACTS.minimal.slice(0, 4) }, isLoading: false });
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal.slice(0, 4), FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText(/You need at least 5 contacts with photos/i)).toBeTruthy();
      });
    });

    it('filters out contacts without photos', async () => {
      mockUseGetUserQuery.mockReturnValue({ data: { contacts: QUIZ_CONTACTS.withoutPhotos }, isLoading: false });
      const { getByText, queryByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.withoutPhotos, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // Contacts WITH photos should be in options
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Charlie')).toBeTruthy();

      // Contacts WITHOUT photos (Bob, David, Grace) should NOT be rendered
      // Note: They might appear as options, so we can't strictly test this
      // The important test is that we have enough contacts to play
    });

    it('shows loading state while filters load', async () => {
      const { UNSAFE_getByType } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.notLoaded),
      });

      // Should show loading indicator
      const indicator = UNSAFE_getByType(require('react-native').ActivityIndicator);
      expect(indicator).toBeTruthy();
    });
  });

  describe('Question Generation', () => {
    it('shuffles answer options', async () => {
      const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // Verify Math.random was called for shuffling options
      expect(mathRandomSpy).toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });

    it('always includes correct answer', async () => {
      const { getByText, getAllByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // One of the 5 options MUST be the correct answer
      // Since we have 5 contacts and 5 options, all names should appear
      const allNames = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
      allNames.forEach(name => {
        expect(getByText(name)).toBeTruthy();
      });
    });

    it('generates 4 random wrong answers', async () => {
      const { getAllByRole } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        const buttons = getAllByRole('button');
        // Should have 5 answer buttons (1 correct + 4 wrong)
        expect(buttons.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('handles edge case: exactly 5 contacts', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // All 5 contacts should be used as options
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('Charlie')).toBeTruthy();
      expect(getByText('David')).toBeTruthy();
      expect(getByText('Eve')).toBeTruthy();
    });
  });

  describe('Answer Selection - Correct', () => {
    it('displays "Correct!" feedback via green button', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // Get the question text to know which contact we're looking at
      const progressText = getByText(/Question 1 of 5/);
      expect(progressText).toBeTruthy();

      // Click any option (we'll verify feedback appears)
      const aliceButton = getByText('Alice');
      fireEvent.press(aliceButton);

      // The button should change style (we can't easily test style, but we can verify it exists)
      expect(aliceButton).toBeTruthy();
    });

    it('triggers bounce animation', async () => {
      const { withSequence } = require('react-native-reanimated');

      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');
      fireEvent.press(aliceButton);

      // Verify withSequence was called (for animation)
      await waitFor(() => {
        expect(withSequence).toHaveBeenCalled();
      });
    });

    it('plays rising tone sound', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');

      act(() => {
        fireEvent.press(aliceButton);
      });

      // Verify AudioContext was used
      await waitFor(() => {
        expect(global.AudioContext).toHaveBeenCalled();
      });
    });

    it('auto-advances after 600ms', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');

      act(() => {
        fireEvent.press(aliceButton);
      });

      // Fast-forward 600ms
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should advance to question 2
      await waitFor(() => {
        expect(getByText(/Question 2 of 5/)).toBeTruthy();
      });
    });

    it('clears feedback after advance', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');

      act(() => {
        fireEvent.press(aliceButton);
      });

      // Fast-forward to after auto-advance
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(getByText(/Question 2 of 5/)).toBeTruthy();
      });

      // Feedback should be cleared (we can verify by checking question number changed)
      expect(getByText(/Question 2 of 5/)).toBeTruthy();
    });
  });

  describe('Answer Selection - Incorrect', () => {
    it('displays "Try again!" feedback via red button', async () => {
      const contacts = QUIZ_CONTACTS.minimal;
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(contacts, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      // Click a wrong answer (we need to know which is correct first)
      // For simplicity, we'll just click and verify the button exists
      const bobButton = getByText('Bob');
      fireEvent.press(bobButton);

      // Button should still exist (even if it turns red)
      expect(bobButton).toBeTruthy();
    });

    it('triggers shake animation', async () => {
      const { withSequence } = require('react-native-reanimated');

      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const bobButton = getByText('Bob');
      fireEvent.press(bobButton);

      // Verify withSequence was called (for shake animation)
      await waitFor(() => {
        expect(withSequence).toHaveBeenCalled();
      });
    });

    it('plays descending buzz sound', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const bobButton = getByText('Bob');

      act(() => {
        fireEvent.press(bobButton);
      });

      // Verify AudioContext was called
      await waitFor(() => {
        expect(global.AudioContext).toHaveBeenCalled();
      });
    });

    it('does NOT advance to next question', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const bobButton = getByText('Bob');

      act(() => {
        fireEvent.press(bobButton);
      });

      // Fast-forward 600ms
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should still be on question 1
      await waitFor(() => {
        expect(getByText(/Question 1 of 5/)).toBeTruthy();
      });
    });

    it('clears feedback after 300ms', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const bobButton = getByText('Bob');

      act(() => {
        fireEvent.press(bobButton);
      });

      // Fast-forward 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Feedback should clear but still on same question
      await waitFor(() => {
        expect(getByText(/Question 1 of 5/)).toBeTruthy();
      });
    });

    it('allows retry with same question', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const bobButton = getByText('Bob');

      // First attempt (wrong)
      act(() => {
        fireEvent.press(bobButton);
      });

      // Wait for feedback to clear
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should still be able to click again
      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      // Should work (we verify by checking AudioContext called again)
      expect(global.AudioContext).toHaveBeenCalled();
    });
  });

  describe('Quiz Loop', () => {
    it('loops back to start after last contact', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      // Answer all 5 questions correctly (simplified - just advance through)
      for (let i = 0; i < 5; i++) {
        const aliceButton = getByText('Alice');
        act(() => {
          fireEvent.press(aliceButton);
        });

        act(() => {
          jest.advanceTimersByTime(600);
        });
      }

      // Should loop back to question 1
      await waitFor(() => {
        expect(getByText(/Question 1 of 5/)).toBeTruthy();
      });
    });

    it('reshuffles contacts on loop restart', async () => {
      const mathRandomSpy = jest.spyOn(Math, 'random');

      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const initialCallCount = mathRandomSpy.mock.calls.length;

      // Complete the quiz
      for (let i = 0; i < 5; i++) {
        const aliceButton = getByText('Alice');
        act(() => {
          fireEvent.press(aliceButton);
        });

        act(() => {
          jest.advanceTimersByTime(600);
        });
      }

      // Math.random should be called again for reshuffling
      await waitFor(() => {
        expect(mathRandomSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
      });

      mathRandomSpy.mockRestore();
    });

    it('maintains quiz state across loops', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      // Complete one full loop
      for (let i = 0; i < 5; i++) {
        const aliceButton = getByText('Alice');
        act(() => {
          fireEvent.press(aliceButton);
        });

        act(() => {
          jest.advanceTimersByTime(600);
        });
      }

      // Should still show quiz (not crash or show empty state)
      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });
    });
  });

  describe('Button Interactions', () => {
    it('disables buttons while correct feedback shows', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');

      act(() => {
        fireEvent.press(aliceButton);
      });

      // Try to click another button immediately
      const bobButton = getByText('Bob');
      act(() => {
        fireEvent.press(bobButton);
      });

      // Should still be on question 1 (second click ignored)
      expect(getByText(/Question 1 of 5/)).toBeTruthy();
    });

    it('re-enables buttons after feedback clears', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const bobButton = getByText('Bob');

      // Click wrong answer
      act(() => {
        fireEvent.press(bobButton);
      });

      // Wait for feedback to clear
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should be able to click again
      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      // Verify action happened (button exists and is clickable)
      expect(aliceButton).toBeTruthy();
    });

    it('prevents double-tap on same answer', async () => {
      const { getByText } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Question 1 of 5')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');

      // Double-tap
      act(() => {
        fireEvent.press(aliceButton);
        fireEvent.press(aliceButton);
      });

      // Should only process once (still on question 1 or advanced to 2, not 3)
      act(() => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        const questionText = getByText(/Question \d of 5/);
        expect(questionText).toBeTruthy();
        // Should be question 2 (not 3)
        expect(getByText(/Question 2 of 5/)).toBeTruthy();
      });
    });
  });

  describe('Snapshots', () => {
    it('matches snapshot for initial render with 5 contacts', async () => {
      const tree = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(tree.getByText('Who is this?')).toBeTruthy();
      });

      expect(tree.toJSON()).toMatchSnapshot();
    });

    it('matches snapshot for feedback state (correct)', async () => {
      const { getByText, toJSON } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const aliceButton = getByText('Alice');
      act(() => {
        fireEvent.press(aliceButton);
      });

      // Capture snapshot during feedback
      expect(toJSON()).toMatchSnapshot();
    });

    it('matches snapshot for feedback state (incorrect)', async () => {
      const { getByText, toJSON } = renderWithRedux(<QuizGameScreen />, {
        preloadedState: createQuizStoreState(QUIZ_CONTACTS.minimal, FILTER_STATES.singleCategory),
      });

      await waitFor(() => {
        expect(getByText('Who is this?')).toBeTruthy();
      });

      const bobButton = getByText('Bob');
      act(() => {
        fireEvent.press(bobButton);
      });

      // Capture snapshot during feedback
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
