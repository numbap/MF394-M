/**
 * Storage Service
 *
 * Handles persistent storage of UI state (filters) to localStorage/AsyncStorage.
 * Contact data is fetched from the live API and cached by RTK Query.
 */

const FILTERS_STORAGE_KEY = 'filters_v1';

interface StoredFilters {
  version: number;
  timestamp: number;
  categories: string[];
  tags: string[];
}

export class StorageService {
  /**
   * Load filter selections from persistent storage
   */
  static async loadFilters(): Promise<{ categories: string[]; tags: string[] }> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(FILTERS_STORAGE_KEY);
        if (data) {
          const stored: StoredFilters = JSON.parse(data);
          return {
            categories: stored.categories || [],
            tags: stored.tags || [],
          };
        }
      }

      return { categories: [], tags: [] };
    } catch (error) {
      console.error('Failed to load filters from storage:', error);
      return { categories: [], tags: [] };
    }
  }

  /**
   * Save filter selections to persistent storage
   */
  static async saveFilters(filters: { categories: string[]; tags: string[] }): Promise<void> {
    try {
      const data: StoredFilters = {
        version: 1,
        timestamp: Date.now(),
        categories: filters.categories,
        tags: filters.tags,
      };

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save filters to storage:', error);
    }
  }

  /**
   * Clear filter selections from storage
   */
  static async clearFilters(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(FILTERS_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear filters from storage:', error);
    }
  }
}
