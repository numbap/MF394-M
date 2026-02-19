import AsyncStorage from "@react-native-async-storage/async-storage";

export const tokenStorage = {
  async getToken() {
    try {
      return await AsyncStorage.getItem("auth_token");
    } catch (e) {
      console.warn("Error retrieving token", e);
      return null;
    }
  },

  async setToken(token) {
    try {
      await AsyncStorage.setItem("auth_token", token);
    } catch (e) {
      console.warn("Error storing token", e);
    }
  },

  async clearToken() {
    try {
      await AsyncStorage.removeItem("auth_token");
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
