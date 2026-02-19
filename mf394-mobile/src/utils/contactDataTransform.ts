/**
 * Contact data transformation utilities
 * Transforms mock data to match the Contact interface
 */

import { Contact } from '../store/api/contacts.api';

// Category mapping from mock data to Contact interface
const CATEGORY_MAP: Record<string, Contact['category']> = {
  Family: 'friends-family',
  Community: 'community',
  Pursuits: 'goals-hobbies',
  Work: 'work',
  Miscellaneous: 'miscellaneous',
};

/**
 * Transform a mock contact to the Contact interface format
 * - Maps category names to standardized values
 * - Capitalizes tag names
 */
export function transformMockContact(mockContact: any): Contact {
  const category = CATEGORY_MAP[mockContact.category] || 'miscellaneous';

  // Capitalize tags
  const capitalizedTags = (mockContact.groups || []).map((tag: string) =>
    tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
  );

  return {
    _id: mockContact._id,
    name: mockContact.name,
    hint: mockContact.hint || undefined,
    photo: mockContact.photo || undefined,
    summary: mockContact.summary || undefined,
    category,
    groups: capitalizedTags,
    created: new Date(mockContact.created).getTime(),
    edited: new Date(mockContact.edited).getTime(),
  };
}

/**
 * Transform all mock contacts from the mock_user.json format
 */
export function transformMockContacts(mockContacts: any[]): Contact[] {
  return mockContacts.map(transformMockContact);
}
