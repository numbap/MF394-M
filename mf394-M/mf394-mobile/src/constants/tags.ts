/**
 * Canonical tag definitions
 * Single source of truth for all available tags across the app
 */

/**
 * Default tags - actual tags managed by Redux tags slice
 * These tags are used to initialize the tags slice on app load
 */
export const AVAILABLE_TAGS: readonly string[] = Object.freeze([
  'friend',
  'family',
  'work-colleague',
  'mentor',
  'student',
  'neighbor',
  'volunteer',
  'teammate',
]);
