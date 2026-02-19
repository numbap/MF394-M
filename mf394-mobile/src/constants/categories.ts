/**
 * Canonical category definitions
 * Single source of truth for all category data across the app
 */

export interface Category {
  label: string;
  value: string;
  icon: string;
}

/**
 * All available categories with their correct icons
 * Order matters: Miscellaneous should always be last
 */
export const CATEGORIES: readonly Category[] = Object.freeze([
  { label: 'Friends & Family', value: 'friends-family', icon: 'heart' },
  { label: 'Community', value: 'community', icon: 'globe' },
  { label: 'Work', value: 'work', icon: 'briefcase' },
  { label: 'Goals & Hobbies', value: 'goals-hobbies', icon: 'trophy' },
  { label: 'Miscellaneous', value: 'miscellaneous', icon: 'star' },
]);

/**
 * Default category for new contacts
 */
export const DEFAULT_CATEGORY = 'miscellaneous';
