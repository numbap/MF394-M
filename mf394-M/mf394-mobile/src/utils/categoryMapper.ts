/**
 * Category Mapper
 *
 * Maps between the app's internal kebab-case category format
 * and the API's Title Case format.
 */

const APP_TO_API: Record<string, string> = {
  'friends-family': 'Family',
  'community': 'Community',
  'work': 'Work',
  'goals-hobbies': 'Pursuits',
  'miscellaneous': 'Miscellaneous',
};

const API_TO_APP: Record<string, string> = {
  'Family': 'friends-family',
  'Community': 'community',
  'Work': 'work',
  'Pursuits': 'goals-hobbies',
  'Miscellaneous': 'miscellaneous',
};

export const mapCategoryToAPI = (appCategory: string): string => {
  return APP_TO_API[appCategory] || 'Miscellaneous';
};

export const mapCategoryFromAPI = (apiCategory: string): string => {
  return API_TO_APP[apiCategory] || 'miscellaneous';
};
