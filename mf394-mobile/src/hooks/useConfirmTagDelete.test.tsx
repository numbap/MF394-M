/**
 * useConfirmTagDelete Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useConfirmTagDelete } from './useConfirmTagDelete';
import { showAlert } from '../utils/showAlert';
import contactsReducer from '../store/slices/contacts.slice';
import { Contact } from '../store/api/contacts.api';

jest.mock('../utils/showAlert');

const mockShowAlert = showAlert as jest.MockedFunction<typeof showAlert>;

describe('useConfirmTagDelete', () => {
  const createMockStore = (contacts: Contact[]) => {
    return configureStore({
      reducer: {
        contacts: contactsReducer,
      },
      preloadedState: {
        contacts: {
          data: contacts,
          loading: false,
          error: null,
        },
      },
    });
  };

  const createWrapper = (store: any) => {
    return ({ children }: any) => <Provider store={store}>{children}</Provider>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show confirmation with affected contact count', async () => {
    const contacts: Contact[] = [
      {
        _id: '1',
        name: 'Alice',
        category: 'friends-family',
        groups: ['friend', 'mentor'],
        created: Date.now(),
        edited: Date.now(),
      },
      {
        _id: '2',
        name: 'Bob',
        category: 'work',
        groups: ['friend'],
        created: Date.now(),
        edited: Date.now(),
      },
      {
        _id: '3',
        name: 'Charlie',
        category: 'community',
        groups: ['volunteer'],
        created: Date.now(),
        edited: Date.now(),
      },
    ];

    const store = createMockStore(contacts);
    const { result } = renderHook(() => useConfirmTagDelete(), {
      wrapper: createWrapper(store),
    });

    // Mock user confirming deletion
    mockShowAlert.mockImplementation((title, message, buttons) => {
      expect(title).toBe('Delete Tag?');
      expect(message).toBe("Delete 'friend' tag? This will remove it from 2 contacts.");
      // Simulate user pressing Delete button
      buttons?.[1].onPress?.();
    });

    const confirmed = await result.current.confirmDelete('friend');
    expect(confirmed).toBe(true);
    expect(mockShowAlert).toHaveBeenCalled();
  });

  it('should show singular "contact" for 1 affected contact', async () => {
    const contacts: Contact[] = [
      {
        _id: '1',
        name: 'Alice',
        category: 'friends-family',
        groups: ['mentor'],
        created: Date.now(),
        edited: Date.now(),
      },
    ];

    const store = createMockStore(contacts);
    const { result } = renderHook(() => useConfirmTagDelete(), {
      wrapper: createWrapper(store),
    });

    mockShowAlert.mockImplementation((title, message, buttons) => {
      expect(message).toBe("Delete 'mentor' tag? This will remove it from 1 contact.");
      buttons?.[1].onPress?.();
    });

    await result.current.confirmDelete('mentor');
  });

  it('should show simple message for 0 affected contacts', async () => {
    const contacts: Contact[] = [
      {
        _id: '1',
        name: 'Alice',
        category: 'friends-family',
        groups: ['friend'],
        created: Date.now(),
        edited: Date.now(),
      },
    ];

    const store = createMockStore(contacts);
    const { result } = renderHook(() => useConfirmTagDelete(), {
      wrapper: createWrapper(store),
    });

    mockShowAlert.mockImplementation((title, message, buttons) => {
      expect(message).toBe("Delete 'unused-tag' tag?");
      buttons?.[1].onPress?.();
    });

    await result.current.confirmDelete('unused-tag');
  });

  it('should return false when user cancels', async () => {
    const contacts: Contact[] = [];
    const store = createMockStore(contacts);
    const { result } = renderHook(() => useConfirmTagDelete(), {
      wrapper: createWrapper(store),
    });

    // Mock user pressing Cancel button
    mockShowAlert.mockImplementation((title, message, buttons) => {
      buttons?.[0].onPress?.(); // Press Cancel
    });

    const confirmed = await result.current.confirmDelete('friend');
    expect(confirmed).toBe(false);
  });

  it('should handle empty contacts list', async () => {
    const store = createMockStore([]);
    const { result } = renderHook(() => useConfirmTagDelete(), {
      wrapper: createWrapper(store),
    });

    mockShowAlert.mockImplementation((title, message, buttons) => {
      expect(message).toBe("Delete 'friend' tag?");
      buttons?.[1].onPress?.();
    });

    const confirmed = await result.current.confirmDelete('friend');
    expect(confirmed).toBe(true);
  });

  it('should correctly count contacts with multiple tags', async () => {
    const contacts: Contact[] = [
      {
        _id: '1',
        name: 'Alice',
        category: 'friends-family',
        groups: ['friend', 'mentor', 'volunteer'],
        created: Date.now(),
        edited: Date.now(),
      },
      {
        _id: '2',
        name: 'Bob',
        category: 'work',
        groups: ['mentor'],
        created: Date.now(),
        edited: Date.now(),
      },
    ];

    const store = createMockStore(contacts);
    const { result } = renderHook(() => useConfirmTagDelete(), {
      wrapper: createWrapper(store),
    });

    mockShowAlert.mockImplementation((title, message, buttons) => {
      expect(message).toBe("Delete 'mentor' tag? This will remove it from 2 contacts.");
      buttons?.[1].onPress?.();
    });

    await result.current.confirmDelete('mentor');
  });
});
