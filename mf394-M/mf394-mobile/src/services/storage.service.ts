/**
 * Storage Service
 *
 * Handles persistent storage of contacts to AsyncStorage/localStorage.
 * Provides utilities for saving, loading, and clearing contacts from local storage.
 */

import { Contact } from '../store/api/contacts.api';

const CONTACTS_STORAGE_KEY = 'contacts_v1';

interface StoredContacts {
  version: number;
  timestamp: number;
  contacts: Contact[];
}

/**
 * StorageService handles local persistence of contacts
 */
export class StorageService {
  /**
   * Load contacts from persistent storage
   */
  static async loadContacts(): Promise<Contact[]> {
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
   */
  static async saveContacts(contacts: Contact[]): Promise<void> {
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
   */
  static async clearContacts(): Promise<void> {
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
}
