/**
 * Sync Queue Service
 *
 * Manages offline mutations and sync queue persistence.
 * Provides utilities for queuing mutations, retrying, and conflict resolution.
 */

import { v4 as uuidv4 } from 'uuid';
import type { QueuedMutation } from '../store/slices/sync.slice';

const STORAGE_KEY = 'sync_queue';

interface StoredQueue {
  version: number;
  timestamp: number;
  mutations: QueuedMutation[];
}

/**
 * SyncQueueService handles offline-first mutation management
 */
export class SyncQueueService {
  /**
   * Create a queued mutation action
   */
  static createQueuedMutation(
    actionType: string,
    payload: any,
    maxRetries: number = 3
  ): QueuedMutation {
    return {
      id: uuidv4(),
      timestamp: Date.now(),
      action: {
        type: actionType,
        payload,
      },
      retryCount: 0,
      maxRetries,
    };
  }

  /**
   * Load queue from persistent storage
   */
  static async loadQueueFromStorage(): Promise<QueuedMutation[]> {
    try {
      // For web, use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(STORAGE_KEY);
        if (data) {
          const stored: StoredQueue = JSON.parse(data);
          return stored.mutations || [];
        }
      }

      // For native, you would use AsyncStorage from react-native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // const data = await AsyncStorage.getItem(STORAGE_KEY);
      // if (data) {
      //   const stored: StoredQueue = JSON.parse(data);
      //   return stored.mutations || [];
      // }

      return [];
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
      return [];
    }
  }

  /**
   * Save queue to persistent storage
   */
  static async saveQueueToStorage(mutations: QueuedMutation[]): Promise<void> {
    try {
      const data: StoredQueue = {
        version: 1,
        timestamp: Date.now(),
        mutations,
      };

      // For web
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }

      // For native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  /**
   * Clear queue from storage
   */
  static async clearQueueFromStorage(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }

      // For native
      // const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear queue from storage:', error);
    }
  }

  /**
   * Check if two mutations conflict (operate on same entity)
   */
  static detectConflict(mutation1: QueuedMutation, mutation2: QueuedMutation): boolean {
    // Simple conflict detection based on action type and entity ID
    if (mutation1.action.type !== mutation2.action.type) {
      return false;
    }

    const id1 = mutation1.action.payload?.id;
    const id2 = mutation2.action.payload?.id;

    return id1 && id1 === id2;
  }

  /**
   * Resolve conflicts by removing duplicate operations
   * Keep the latest operation for each entity
   */
  static resolveConflicts(mutations: QueuedMutation[]): QueuedMutation[] {
    const seen = new Map<string, QueuedMutation>();

    for (const mutation of mutations) {
      const key = `${mutation.action.type}:${mutation.action.payload?.id}`;

      if (seen.has(key)) {
        const existing = seen.get(key)!;
        // Keep the newer mutation
        if (mutation.timestamp > existing.timestamp) {
          seen.set(key, mutation);
        }
      } else {
        seen.set(key, mutation);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Get mutations for a specific entity
   */
  static getEntityMutations(
    mutations: QueuedMutation[],
    entityId: string
  ): QueuedMutation[] {
    return mutations.filter((m) => m.action.payload?.id === entityId);
  }

  /**
   * Get mutations by action type
   */
  static getMutationsByType(
    mutations: QueuedMutation[],
    actionType: string
  ): QueuedMutation[] {
    return mutations.filter((m) => m.action.type === actionType);
  }

  /**
   * Cancel a queued mutation (remove it from queue)
   */
  static cancelMutation(mutations: QueuedMutation[], mutationId: string): QueuedMutation[] {
    return mutations.filter((m) => m.id !== mutationId);
  }

  /**
   * Retry a failed mutation (reset retry count)
   */
  static retryMutation(mutations: QueuedMutation[], mutationId: string): QueuedMutation[] {
    return mutations.map((m) =>
      m.id === mutationId
        ? { ...m, retryCount: 0 }
        : m
    );
  }

  /**
   * Estimate queue size for UI feedback
   */
  static getQueueStats(mutations: QueuedMutation[]): {
    total: number;
    pending: number;
    retrying: number;
  } {
    return {
      total: mutations.length,
      pending: mutations.filter((m) => m.retryCount === 0).length,
      retrying: mutations.filter((m) => m.retryCount > 0).length,
    };
  }
}
