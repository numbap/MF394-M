/**
 * Session Cache
 *
 * Persists auth session and user data to AsyncStorage so the app
 * can restore instantly on cold start without waiting for network.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../store/slices/auth.slice';

const SESSION_KEY = 'session_cache';
const USER_DATA_KEY = 'user_data_cache';

export async function saveSession(user: User, token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ user, token }));
  } catch {
    // Silent failure — cache is best-effort
  }
}

export async function loadSession(): Promise<{ user: User; token: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user && parsed?.token) return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function saveUserData(data: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
  } catch {
    // Silent failure
  }
}

export async function loadUserData(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearSessionCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SESSION_KEY, USER_DATA_KEY]);
  } catch {
    // Silent failure
  }
}
