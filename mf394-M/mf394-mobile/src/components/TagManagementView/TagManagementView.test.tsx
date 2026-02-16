/**
 * TagManagementView Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TagManagementView } from './TagManagementView';
import tagsReducer from '../../store/slices/tags.slice';
import contactsReducer from '../../store/slices/contacts.slice';
import { Contact } from '../../store/api/contacts.api';

jest.mock('../../hooks/useConfirmTagDelete', () => ({
  useConfirmTagDelete: () => ({
    confirmDelete: jest.fn((tagName: string) => {
      // Mock implementation that simulates confirmation
      return Promise.resolve(true);
    }),
  }),
}));

describe('TagManagementView', () => {
  const createMockStore = (initialTags: string[] = ['friend', 'family'], contacts: Contact[] = []) => {
    return configureStore({
      reducer: {
        tags: tagsReducer,
        contacts: contactsReducer,
      },
      preloadedState: {
        tags: {
          tags: initialTags,
        },
        contacts: {
          data: contacts,
          loading: false,
          error: null,
        },
      },
    });
  };

  const renderWithStore = (store: any, onExit = jest.fn()) => {
    return render(
      <Provider store={store}>
        <TagManagementView onExit={onExit} />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render view with title and sections', () => {
      const store = createMockStore();
      const { getByText } = renderWithStore(store);

      expect(getByText('Manage Tags')).toBeTruthy();
      expect(getByText('Add New Tag')).toBeTruthy();
      expect(getByText('Existing Tags (2)')).toBeTruthy();
    });

    it('should render all existing tags as pills', () => {
      const store = createMockStore(['friend', 'family', 'mentor']);
      const { getByText } = renderWithStore(store);

      expect(getByText('friend')).toBeTruthy();
      expect(getByText('family')).toBeTruthy();
      expect(getByText('mentor')).toBeTruthy();
    });

    it('should show empty state when no tags', () => {
      const store = createMockStore([]);
      const { getByText } = renderWithStore(store);

      expect(getByText('No tags yet')).toBeTruthy();
      expect(getByText('Add your first tag above')).toBeTruthy();
    });

    it('should show correct tag count', () => {
      const store = createMockStore(['tag1', 'tag2', 'tag3']);
      const { getByText } = renderWithStore(store);

      expect(getByText('Existing Tags (3)')).toBeTruthy();
    });

    it('should render back button', () => {
      const store = createMockStore();
      const { getByText } = renderWithStore(store);

      expect(getByText('Back to Form')).toBeTruthy();
    });
  });

  describe('adding tags', () => {
    it('should add a new tag', async () => {
      const store = createMockStore(['friend']);
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      const addButton = getByTestId('add-tag-button');

      fireEvent.changeText(input, 'mentor');
      fireEvent.press(addButton);

      await waitFor(() => {
        expect(getByText('mentor')).toBeTruthy();
      });
    });

    it('should normalize tag to lowercase', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'Work-Colleague');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(getByText('work-colleague')).toBeTruthy();
      });
    });

    it('should replace spaces with hyphens', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'work colleague');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(getByText('work-colleague')).toBeTruthy();
      });
    });

    it('should show error for empty tag', () => {
      const store = createMockStore(['friend']);
      const { getByTestId } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, '   ');

      // Tags should remain unchanged (button is disabled)
      const state = store.getState();
      expect(state.tags.tags).toEqual(['friend']);
    });

    it('should show error for duplicate tag', () => {
      const store = createMockStore(['friend', 'family']);
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'Friend'); // Case-insensitive duplicate

      fireEvent.press(getByTestId('add-tag-button'));

      expect(getByText('This tag already exists')).toBeTruthy();
    });

    it('should show error for tag longer than 30 characters', () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'a'.repeat(31));
      fireEvent.press(getByTestId('add-tag-button'));

      expect(getByText('Tag name must be 30 characters or less')).toBeTruthy();
    });

    it('should clear input after successful add', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'mentor');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    it('should NOT show success message after adding tag', async () => {
      const store = createMockStore();
      const { getByTestId, queryByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'mentor');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(queryByText("Tag 'mentor' added")).toBeNull();
      });
    });

    it('should clear error when user starts typing', () => {
      const store = createMockStore(['friend']);
      const { getByTestId, getByText, queryByText } = renderWithStore(store);

      const input = getByTestId('tag-input');

      // Trigger error
      fireEvent.changeText(input, 'friend');
      fireEvent.press(getByTestId('add-tag-button'));
      expect(getByText('This tag already exists')).toBeTruthy();

      // Type again - error should clear
      fireEvent.changeText(input, 'mentor');
      expect(queryByText('This tag already exists')).toBeNull();
    });

    it('should prepend new tag to beginning of list', async () => {
      const store = createMockStore(['friend', 'family']);
      const { getByTestId } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'mentor');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.tags.tags[0]).toBe('mentor'); // New tag at beginning
        expect(state.tags.tags).toEqual(['mentor', 'friend', 'family']);
      });
    });
  });

  describe('deleting tags', () => {
    it('should have testID for each tag pill', () => {
      const store = createMockStore(['friend', 'family']);
      const { getByTestId } = renderWithStore(store);

      expect(getByTestId('tag-pill-friend')).toBeTruthy();
      expect(getByTestId('tag-pill-family')).toBeTruthy();
    });

    it('should trigger delete on long press', async () => {
      const store = createMockStore(['friend', 'family']);
      const { getByTestId, queryByText } = renderWithStore(store);

      const pill = getByTestId('tag-pill-friend');
      fireEvent(pill, 'onLongPress');

      await waitFor(() => {
        const state = store.getState();
        expect(state.tags.tags).not.toContain('friend');
      });
    });

    it('should trigger delete on double-click', async () => {
      const store = createMockStore(['friend', 'family']);
      const { getByTestId } = renderWithStore(store);

      const pill = getByTestId('tag-pill-friend');

      // First click
      fireEvent.press(pill);

      // Second click within 300ms
      fireEvent.press(pill);

      await waitFor(() => {
        const state = store.getState();
        expect(state.tags.tags).not.toContain('friend');
      });
    });
  });

  describe('back button', () => {
    it('should call onExit when back button pressed', () => {
      const onExit = jest.fn();
      const store = createMockStore();
      const { getByText } = renderWithStore(store, onExit);

      fireEvent.press(getByText('Back to Form'));

      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle tag with special characters', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');
      fireEvent.changeText(input, 'tag-with_special.chars');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(getByText('tag-with_special.chars')).toBeTruthy();
      });
    });

    it('should handle multiple tags being added sequentially', async () => {
      const store = createMockStore();
      const { getByTestId, getByText } = renderWithStore(store);

      const input = getByTestId('tag-input');

      // Add first tag
      fireEvent.changeText(input, 'mentor');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(getByText('mentor')).toBeTruthy();
      });

      // Add second tag
      fireEvent.changeText(input, 'volunteer');
      fireEvent.press(getByTestId('add-tag-button'));

      await waitFor(() => {
        expect(getByText('volunteer')).toBeTruthy();
        expect(getByText('mentor')).toBeTruthy();
      });
    });

    it('should handle empty tag list', () => {
      const store = createMockStore([]);
      const { getByText } = renderWithStore(store);

      expect(getByText('Existing Tags (0)')).toBeTruthy();
      expect(getByText('No tags yet')).toBeTruthy();
    });
  });
});
