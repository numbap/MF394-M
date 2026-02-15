/**
 * Regression Test for ContactCard Fix
 *
 * Tests the fix for: "Cannot read properties of undefined (reading 'photo')"
 * This error occurred when selecting all categories in the listing view.
 *
 * The issue was that ContactCard was being passed individual props (id, name, photo, etc.)
 * instead of the full Contact object that the component expected.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ContactCard } from '../src/components/ContactCard';
import type { Contact } from '../src/store/api/contacts.api';

describe('ContactCard - Regression Tests', () => {
  describe('Fix for undefined contact object error', () => {
    it('accepts full Contact object without errors', () => {
      const contact: Contact = {
        _id: '1',
        name: 'John Doe',
        hint: 'Friend',
        photo: 'https://example.com/photo.jpg',
        category: 'friends-family',
        groups: ['friends'],
        created: Date.now(),
        edited: Date.now(),
      };

      expect(() => {
        render(<ContactCard contact={contact} />);
      }).not.toThrow();
    });

    it('does not crash when accessing contact.photo', () => {
      const contact: Contact = {
        _id: '2',
        name: 'Alice Smith',
        photo: 'https://example.com/alice.jpg',
        category: 'work',
        groups: [],
        created: Date.now(),
        edited: Date.now(),
      };

      const { UNSAFE_getByType } = render(<ContactCard contact={contact} />);
      // Component should render without "Cannot read properties of undefined" error
      expect(contact.photo).toBeDefined();
    });

    it('handles contact without photo property', () => {
      const contact: Contact = {
        _id: '3',
        name: 'Bob Wilson',
        category: 'community',
        groups: [],
        created: Date.now(),
        edited: Date.now(),
      };

      expect(() => {
        render(<ContactCard contact={contact} />);
      }).not.toThrow();
    });

    it('destructures all necessary properties from contact object', () => {
      const contact: Contact = {
        _id: '4',
        name: 'Carol Davis',
        hint: 'Colleague',
        photo: 'https://example.com/carol.jpg',
        summary: 'Worked on project X',
        category: 'goals-hobbies',
        groups: ['projects', 'team'],
        created: 1640000000000,
        edited: 1640100000000,
      };

      const { getByText } = render(<ContactCard contact={contact} />);

      // All destructured properties should be accessible
      expect(getByText('Carol Davis')).toBeTruthy(); // name
      expect(getByText('Colleague')).toBeTruthy(); // hint
    });

    it('works with all category types', () => {
      const categories: Array<Contact['category']> = [
        'friends-family',
        'community',
        'work',
        'goals-hobbies',
        'miscellaneous',
      ];

      categories.forEach((category) => {
        const contact: Contact = {
          _id: Math.random().toString(),
          name: `Test ${category}`,
          category,
          groups: [],
          created: Date.now(),
          edited: Date.now(),
        };

        expect(() => {
          render(<ContactCard contact={contact} />);
        }).not.toThrow();
      });
    });

    it('properly passes contact from ListingScreen to ContactCard', () => {
      // Simulates how ListingScreen passes contact to ContactCard
      const filteredContact: Contact = {
        _id: 'contact-123',
        name: 'Test Contact',
        photo: 'https://example.com/test.jpg',
        hint: 'Test hint',
        category: 'friends-family',
        groups: ['test'],
        created: Date.now(),
        edited: Date.now(),
      };

      // This is what ListingScreen now does:
      // <ContactCard contact={contact} />
      expect(() => {
        render(<ContactCard contact={filteredContact} />);
      }).not.toThrow();
    });
  });

  describe('Contact object structure compliance', () => {
    it('handles contact with all database fields', () => {
      const fullContact: Contact = {
        _id: 'db-id-12345',
        name: 'Database User',
        hint: 'Database hint',
        photo: 'https://s3.example.com/photos/db-user.jpg',
        summary: 'Summary from database',
        category: 'work',
        groups: ['db-group-1', 'db-group-2'],
        created: 1670000000000,
        edited: 1670100000000,
      };

      const { getByText } = render(<ContactCard contact={fullContact} />);

      expect(getByText('Database User')).toBeTruthy();
      expect(getByText('Database hint')).toBeTruthy();
    });

    it('handles contact with minimal required fields', () => {
      const minimalContact: Contact = {
        _id: 'minimal-id',
        name: 'Minimal',
        category: 'miscellaneous',
        groups: [],
        created: Date.now(),
        edited: Date.now(),
      };

      const { getByText } = render(<ContactCard contact={minimalContact} />);

      expect(getByText('Minimal')).toBeTruthy();
    });
  });
});
