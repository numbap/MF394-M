/**
 * Contacts Slice Tests
 */

import contactsReducer, {
  setContacts,
  setLoading,
  setError,
  addContact,
  updateContact,
  deleteContact,
  removeTagFromAllContacts,
} from './contacts.slice';
import { Contact } from '../api/contacts.api';

describe('contacts.slice', () => {
  const mockContact: Contact = {
    _id: '1',
    name: 'Alice',
    category: 'friends-family',
    groups: ['friend', 'mentor'],
    created: Date.now(),
    edited: Date.now(),
  };

  const initialState = {
    data: [],
    loading: false,
    error: null,
  };

  describe('reducers', () => {
    it('should initialize with empty state', () => {
      const state = contactsReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });

    it('should set contacts', () => {
      const contacts = [mockContact];
      const state = contactsReducer(initialState, setContacts(contacts));
      expect(state.data).toEqual(contacts);
      expect(state.error).toBeNull();
    });

    it('should set loading state', () => {
      const state = contactsReducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('should set error', () => {
      const error = 'Failed to load contacts';
      const state = contactsReducer(initialState, setError(error));
      expect(state.error).toBe(error);
    });

    it('should add a contact', () => {
      const state = contactsReducer(initialState, addContact(mockContact));
      expect(state.data).toHaveLength(1);
      expect(state.data[0]).toEqual(mockContact);
    });

    it('should update a contact', () => {
      const existingState = {
        ...initialState,
        data: [mockContact],
      };

      const updatedContact: Contact = {
        ...mockContact,
        name: 'Alice Updated',
        groups: ['friend', 'family'],
      };

      const state = contactsReducer(existingState, updateContact(updatedContact));
      expect(state.data[0].name).toBe('Alice Updated');
      expect(state.data[0].groups).toEqual(['friend', 'family']);
    });

    it('should not update if contact not found', () => {
      const existingState = {
        ...initialState,
        data: [mockContact],
      };

      const differentContact: Contact = {
        _id: '999',
        name: 'Bob',
        category: 'work',
        groups: [],
        created: Date.now(),
        edited: Date.now(),
      };

      const state = contactsReducer(existingState, updateContact(differentContact));
      expect(state.data).toHaveLength(1);
      expect(state.data[0].name).toBe('Alice'); // Unchanged
    });

    it('should delete a contact', () => {
      const existingState = {
        ...initialState,
        data: [mockContact],
      };

      const state = contactsReducer(existingState, deleteContact('1'));
      expect(state.data).toHaveLength(0);
    });

    it('should not error when deleting non-existent contact', () => {
      const existingState = {
        ...initialState,
        data: [mockContact],
      };

      const state = contactsReducer(existingState, deleteContact('999'));
      expect(state.data).toHaveLength(1); // Unchanged
    });

    describe('removeTagFromAllContacts', () => {
      it('should remove tag from all contacts', () => {
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
            groups: ['friend', 'work-colleague'],
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

        const existingState = {
          ...initialState,
          data: contacts,
        };

        const state = contactsReducer(existingState, removeTagFromAllContacts('friend'));

        // Alice should have only 'mentor' left
        expect(state.data[0].groups).toEqual(['mentor']);

        // Bob should have only 'work-colleague' left
        expect(state.data[1].groups).toEqual(['work-colleague']);

        // Charlie should be unchanged (didn't have 'friend' tag)
        expect(state.data[2].groups).toEqual(['volunteer']);
      });

      it('should handle removing tag that no contacts have', () => {
        const contacts: Contact[] = [
          {
            _id: '1',
            name: 'Alice',
            category: 'friends-family',
            groups: ['friend', 'mentor'],
            created: Date.now(),
            edited: Date.now(),
          },
        ];

        const existingState = {
          ...initialState,
          data: contacts,
        };

        const state = contactsReducer(existingState, removeTagFromAllContacts('nonexistent'));

        // Alice's tags should be unchanged
        expect(state.data[0].groups).toEqual(['friend', 'mentor']);
      });

      it('should result in empty groups array if removing only tag', () => {
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

        const existingState = {
          ...initialState,
          data: contacts,
        };

        const state = contactsReducer(existingState, removeTagFromAllContacts('friend'));

        expect(state.data[0].groups).toEqual([]);
      });

      it('should handle contacts with no tags', () => {
        const contacts: Contact[] = [
          {
            _id: '1',
            name: 'Alice',
            category: 'friends-family',
            groups: [],
            created: Date.now(),
            edited: Date.now(),
          },
        ];

        const existingState = {
          ...initialState,
          data: contacts,
        };

        const state = contactsReducer(existingState, removeTagFromAllContacts('friend'));

        expect(state.data[0].groups).toEqual([]);
      });

      it('should handle empty contacts array', () => {
        const state = contactsReducer(initialState, removeTagFromAllContacts('friend'));
        expect(state.data).toEqual([]);
      });

      it('should preserve contact order', () => {
        const contacts: Contact[] = [
          {
            _id: '1',
            name: 'Alice',
            category: 'friends-family',
            groups: ['friend'],
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
            groups: ['friend'],
            created: Date.now(),
            edited: Date.now(),
          },
        ];

        const existingState = {
          ...initialState,
          data: contacts,
        };

        const state = contactsReducer(existingState, removeTagFromAllContacts('friend'));

        expect(state.data.map(c => c.name)).toEqual(['Alice', 'Bob', 'Charlie']);
      });

      it('should not mutate original state', () => {
        const contacts: Contact[] = [
          {
            _id: '1',
            name: 'Alice',
            category: 'friends-family',
            groups: ['friend', 'mentor'],
            created: Date.now(),
            edited: Date.now(),
          },
        ];

        const existingState = {
          ...initialState,
          data: contacts,
        };

        const originalGroups = [...existingState.data[0].groups];

        contactsReducer(existingState, removeTagFromAllContacts('friend'));

        // Original state should be unchanged (Redux Toolkit uses Immer)
        expect(existingState.data[0].groups).toEqual(originalGroups);
      });
    });
  });
});
