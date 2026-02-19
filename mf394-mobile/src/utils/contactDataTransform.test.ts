/**
 * Tests for contactDataTransform utility
 */

import { transformMockContact, transformMockContacts } from './contactDataTransform';

describe('contactDataTransform', () => {
  describe('transformMockContact', () => {
    it('transforms Family to friends-family', () => {
      const mockContact = {
        _id: '1',
        name: 'John',
        category: 'Family',
        groups: ['tag1'],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.category).toBe('friends-family');
      expect(result.name).toBe('John');
      expect(result._id).toBe('1');
    });

    it('transforms Community correctly', () => {
      const mockContact = {
        _id: '2',
        name: 'Jane',
        category: 'Community',
        groups: [],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.category).toBe('community');
    });

    it('transforms Pursuits to goals-hobbies', () => {
      const mockContact = {
        _id: '3',
        name: 'Bob',
        category: 'Pursuits',
        groups: [],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.category).toBe('goals-hobbies');
    });

    it('transforms Work correctly', () => {
      const mockContact = {
        _id: '4',
        name: 'Alice',
        category: 'Work',
        groups: [],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.category).toBe('work');
    });

    it('defaults to miscellaneous for unknown category', () => {
      const mockContact = {
        _id: '5',
        name: 'Unknown',
        category: 'InvalidCategory',
        groups: [],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.category).toBe('miscellaneous');
    });

    it('capitalizes tags', () => {
      const mockContact = {
        _id: '6',
        name: 'Test',
        category: 'Family',
        groups: ['lowercase', 'UPPERCASE', 'MixedCase'],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.groups).toEqual(['Lowercase', 'Uppercase', 'Mixedcase']);
    });

    it('converts date strings to timestamps', () => {
      const mockContact = {
        _id: '7',
        name: 'DateTest',
        category: 'Family',
        groups: [],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-02-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(typeof result.created).toBe('number');
      expect(typeof result.edited).toBe('number');
      expect(result.created).toBeLessThan(result.edited);
    });

    it('handles optional fields', () => {
      const mockContact = {
        _id: '8',
        name: 'NoExtra',
        category: 'Family',
        groups: [],
        created: '2026-01-01T00:00:00Z',
        edited: '2026-01-01T00:00:00Z',
      };

      const result = transformMockContact(mockContact);

      expect(result.hint).toBeUndefined();
      expect(result.photo).toBeUndefined();
      expect(result.summary).toBeUndefined();
    });
  });

  describe('transformMockContacts', () => {
    it('transforms array of contacts', () => {
      const mockContacts = [
        {
          _id: '1',
          name: 'John',
          category: 'Family',
          groups: ['tag1'],
          created: '2026-01-01T00:00:00Z',
          edited: '2026-01-01T00:00:00Z',
        },
        {
          _id: '2',
          name: 'Jane',
          category: 'Work',
          groups: [],
          created: '2026-01-01T00:00:00Z',
          edited: '2026-01-01T00:00:00Z',
        },
      ];

      const result = transformMockContacts(mockContacts);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('friends-family');
      expect(result[1].category).toBe('work');
    });

    it('handles empty array', () => {
      const result = transformMockContacts([]);

      expect(result).toEqual([]);
    });
  });
});
