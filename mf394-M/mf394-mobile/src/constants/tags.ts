/**
 * Canonical tag definitions
 * Single source of truth for all available tags across the app
 */

/**
 * Available tags for contact organization
 * TODO: Load from API/global state in future
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
