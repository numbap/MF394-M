/**
 * Storage Service
 *
 * Handles persistent storage of contacts to AsyncStorage/localStorage.
 * Provides utilities for saving, loading, and clearing contacts from local storage.
 *
 * In mock mode (AUTH_MOCK=true), persistence is disabled to maintain session-only state.
 */

import { Contact } from '../store/api/contacts.api';
import { AUTH_MOCK } from '@env';

const CONTACTS_STORAGE_KEY = 'contacts_v1';
const FILTERS_STORAGE_KEY = 'filters_v1';

interface StoredContacts {
  version: number;
  timestamp: number;
  contacts: Contact[];
}

interface StoredFilters {
  version: number;
  timestamp: number;
  categories: string[];
  tags: string[];
}

/**
 * StorageService handles local persistence of contacts
 */
export class StorageService {
  /**
   * Load contacts from persistent storage
   * In mock mode, always returns empty array (session-only persistence)
   */
  static async loadContacts(): Promise<Contact[]> {
    // Skip storage in mock mode - use session-only persistence
    if (AUTH_MOCK === 'true') {
      return [];
    }

    try {
      // For web, use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(CONTACTS_STORAGE_KEY);
        if (data) {
          const stored: StoredContacts = JSON.parse(data);
          return stored.contacts || [];
        }
      }

      // For native, use AsyncStorage
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // const data = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      // if (data) {
      //   const stored: StoredContacts = JSON.parse(data);
      //   return stored.contacts || [];
      // }

      return [];
    } catch (error) {
      console.error('Failed to load contacts from storage:', error);
      return [];
    }
  }

  /**
   * Save contacts to persistent storage
   * In mock mode, this is a no-op (session-only persistence)
   */
  static async saveContacts(contacts: Contact[]): Promise<void> {
    // Skip storage in mock mode - use session-only persistence
    if (AUTH_MOCK === 'true') {
      return;
    }

    try {
      const data: StoredContacts = {
        version: 1,
        timestamp: Date.now(),
        contacts,
      };

      // For web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(data));
      }

      // For native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save contacts to storage:', error);
    }
  }

  /**
   * Clear all contacts from storage
   * In mock mode, this is a no-op (session-only persistence)
   */
  static async clearContacts(): Promise<void> {
    // Skip storage in mock mode
    if (AUTH_MOCK === 'true') {
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(CONTACTS_STORAGE_KEY);
      }

      // For native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.removeItem(CONTACTS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear contacts from storage:', error);
    }
  }

  /**
   * Load filter selections from persistent storage
   */
  static async loadFilters(): Promise<{ categories: string[]; tags: string[] }> {
    try {
      // For web, use localStorage
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

      // For native, use AsyncStorage
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // const data = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
      // if (data) {
      //   const stored: StoredFilters = JSON.parse(data);
      //   return {
      //     categories: stored.categories || [],
      //     tags: stored.tags || [],
      //   };
      // }

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

      // For web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(data));
      }

      // For native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(data));
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

      // For native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear filters from storage:', error);
    }
  }
}
