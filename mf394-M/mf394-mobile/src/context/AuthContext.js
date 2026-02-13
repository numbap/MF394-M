import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { tokenStorage } from "../utils/secureStore";

// Temporarily hardcoded environment variables
const GOOGLE_OAUTH_CLIENT_ID_iOS = "522498015179-g0htpel9384on5ubq0ofmlvsa9r2pqvl.apps.googleusercontent.com";
const API_BASE_URL = "https://ummyou.com";

// Conditionally import GoogleSignIn only on native platforms
let GoogleSignIn = null;
try {
  GoogleSignIn = require("@react-native-google-signin/google-signin");
} catch (e) {
  // GoogleSignIn not available (e.g., on web)
  console.warn("GoogleSignIn not available, using mock authentication for testing");
}

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only configure GoogleSignIn if it's available
    if (GoogleSignIn?.configure) {
      try {
        GoogleSignIn.configure({
          webClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
          iosClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
        });
      } catch (e) {
        console.warn("Failed to configure GoogleSignIn", e);
      }
    }
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      if (GoogleSignIn?.isSignedIn) {
        const isSignedIn = await GoogleSignIn.isSignedIn();
        if (isSignedIn) {
          const userInfo = await GoogleSignIn.getCurrentUser();
          if (userInfo) {
            setUser(userInfo.user);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore token", e);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    signIn: async () => {
      try {
        setIsLoading(true);
        console.log("signIn called");

        if (!GoogleSignIn?.signIn) {
          // Mock sign-in for web/testing
          console.warn("Using mock authentication (GoogleSignIn not available)");
          const mockUser = {
            id: "mock-user-123",
            name: "Test User",
            email: "test@example.com",
            photo: null,
          };
          console.log("Setting mock user:", mockUser);
          setUser(mockUser);
          // Store mock token
          await tokenStorage.setAccessToken("mock-access-token");
          await tokenStorage.setRefreshToken("mock-refresh-token");
          setError(null);
          console.log("Mock authentication complete");
          return;
        }

        const userInfo = await GoogleSignIn.signIn();
        const { idToken } = userInfo;

        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          idToken,
        });

        await tokenStorage.setAccessToken(response.data.accessToken);
        await tokenStorage.setRefreshToken(response.data.refreshToken);

        setUser(userInfo.user);
        setError(null);
      } catch (e) {
        setError(e.message);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },

    signOut: async () => {
      try {
        if (GoogleSignIn?.signOut) {
          await GoogleSignIn.signOut();
        }
        await tokenStorage.clearTokens();
        setUser(null);
      } catch (e) {
        setError(e.message);
      }
    },

    user,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}
