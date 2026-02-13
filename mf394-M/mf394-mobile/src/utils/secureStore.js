import AsyncStorage from "@react-native-async-storage/async-storage";

export const tokenStorage = {
  async getAccessToken() {
    try {
      return await AsyncStorage.getItem("accessToken");
    } catch (e) {
      console.warn("Error retrieving access token", e);
      return null;
    }
  },

  async setAccessToken(token) {
    try {
      await AsyncStorage.setItem("accessToken", token);
    } catch (e) {
      console.warn("Error storing access token", e);
    }
  },

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem("refreshToken");
    } catch (e) {
      console.warn("Error retrieving refresh token", e);
      return null;
    }
  },

  async setRefreshToken(token) {
    try {
      await AsyncStorage.setItem("refreshToken", token);
    } catch (e) {
      console.warn("Error storing refresh token", e);
    }
  },

  async clearTokens() {
    try {
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
    } catch (e) {
      console.warn("Error clearing tokens", e);
    }
  },
};
