import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";

// expo-secure-store uses the iOS Keychain on iOS and Android Keystore on Android.
// On web it falls back to localStorage which is acceptable for web-only contexts.
const isWeb = Platform.OS === "web";

export const tokenStorage = {
  async getToken() {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem(TOKEN_KEY);
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn("Error retrieving token", e);
      return null;
    }
  },

  async setToken(token) {
    try {
      if (isWeb) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn("Error storing token", e);
    }
  },

  async clearToken() {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn("Error clearing token", e);
    }
  },

  // Legacy aliases kept for any remaining callers
  async getAccessToken() {
    return this.getToken();
  },

  async setAccessToken(token) {
    return this.setToken(token);
  },

  async clearTokens() {
    return this.clearToken();
  },
};
