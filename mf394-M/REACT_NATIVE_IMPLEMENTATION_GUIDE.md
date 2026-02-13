# React Native Implementation Guide: Face Memorization App

**Project**: Convert mf394 (Next.js web app) to React Native for iOS & Android
**Target Platforms**: iOS & Android (cross-platform)
**Experience Level**: Intermediate React Native developers
**Face Detection**: ML Kit (Google ML Kit)
**Authentication**: Google OAuth
**Testing**: Jest + React Native Testing Library
**MVP Features**: Contact management, Photo upload & face detection, both games

---

## Table of Contents

1. [Phase 1: Project Setup](#phase-1-project-setup)
2. [Phase 2: Authentication (Google OAuth)](#phase-2-authentication-google-oauth)
3. [Phase 3: API Integration](#phase-3-api-integration)
4. [Phase 4: Core Data Management](#phase-4-core-data-management)
5. [Phase 5: Image Handling & Face Detection](#phase-5-image-handling--face-detection)
6. [Phase 6: Contact Management UI](#phase-6-contact-management-ui)
7. [Phase 7: Game Implementation](#phase-7-game-implementation)
8. [Phase 8: Testing](#phase-8-testing)
9. [Phase 9: Polish & Deployment](#phase-9-polish--deployment)

---

## Phase 1: Project Setup

### Step 1.1: Initialize React Native Project

```bash
# Use React Native CLI or Expo (Expo recommended for faster iteration)
npx create-expo-app mf394-mobile
# OR
npx react-native init mf394Mobile --version 0.76.0
```

**Decision Point**: Expo vs. Bare React Native?

- **Expo** (Recommended for MVP):
  - Faster setup, managed build service
  - EAS (Expo Application Services) for building/deploying
  - Good for most use cases
  - Easier to add native modules through prebuild
- **Bare React Native**:
  - More control, but requires Xcode & Android Studio
  - More complex native setup

### Step 1.2: Install Core Dependencies

```bash
npm install react-native-gesture-handler react-native-reanimated react-native-screens
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install @react-native-google-signin/google-signin
npm install @react-native-community/camera react-native-image-crop-picker
npm install axios react-query
npm install react-native-dotenv
```

### Step 1.3: Set Up Project Structure

```
mf394-mobile/
├── src/
│   ├── screens/           # Screen components
│   │   ├── Auth/
│   │   ├── Home/
│   │   ├── Games/
│   │   ├── ImageHandling/
│   │   └── Stats/
│   ├── components/        # Reusable components
│   │   ├── ContactCard/
│   │   ├── GameComponents/
│   │   ├── Modals/
│   │   └── UI/
│   ├── context/           # State management
│   │   ├── AuthContext.js
│   │   ├── ContactsContext.js
│   │   └── GameContext.js
│   ├── services/          # API calls
│   │   ├── authService.js
│   │   ├── contactService.js
│   │   ├── gameService.js
│   │   └── imageService.js
│   ├── utils/             # Utilities
│   │   ├── constants.js
│   │   ├── validators.js
│   │   ├── imageProcessing.js
│   │   └── faceDetection.js
│   ├── hooks/             # Custom hooks
│   │   ├── useFaceDetection.js
│   │   ├── useAuth.js
│   │   └── useContacts.js
│   ├── types/             # TypeScript types (optional)
│   ├── styles/            # Global styles/theme
│   │   └── theme.js
│   └── App.js             # Root component
├── __tests__/             # Test files
├── app.json               # Expo/React Native config
├── .env.example
└── package.json
```

### Step 1.4: Configure Environment Variables

Create `.env` file (based on `.env.example`):

```env
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_ID_iOS=your_ios_specific_client_id
GOOGLE_OAUTH_CLIENT_ID_Android=your_android_specific_client_id
API_BASE_URL=https://your-api-domain.com
API_TIMEOUT=30000
FACE_DETECTION_MIN_CONFIDENCE=0.5
```

### Step 1.5: Set Up Navigation Structure

Create `src/navigation/RootNavigator.js`:

```javascript
import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { AuthContext } from "../context/AuthContext";

import LoginScreen from "../screens/Auth/LoginScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import QuizGameScreen from "../screens/Games/QuizGameScreen";
import PracticeGameScreen from "../screens/Games/PracticeGameScreen";
import ImageUploadScreen from "../screens/ImageHandling/ImageUploadScreen";
import FaceDetectionScreen from "../screens/ImageHandling/FaceDetectionScreen";
import CropImageScreen from "../screens/ImageHandling/CropImageScreen";
import StatsScreen from "../screens/Stats/StatsScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
}

function UnauthenticatedStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="GamesTab" component={GamesStack} />
      <Tab.Screen name="StatsTab" component={StatsScreen} />
    </Tab.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ImageUpload" component={ImageUploadScreen} />
      <Stack.Screen name="FaceDetection" component={FaceDetectionScreen} />
      <Stack.Screen name="CropImage" component={CropImageScreen} />
    </Stack.Navigator>
  );
}

function GamesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="GameSelection" component={GameSelectionScreen} />
      <Stack.Screen name="Quiz" component={QuizGameScreen} />
      <Stack.Screen name="Practice" component={PracticeGameScreen} />
    </Stack.Navigator>
  );
}
```

### Step 1.6: Initialize ESLint & Prettier

```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-react-native
npm install --save-dev @babel/eslint-parser
```

Create `.eslintrc.json`:

```json
{
  "env": {
    "react-native/react-native": true,
    "node": true
  },
  "extends": ["eslint:recommended", "plugin:react-native/all", "prettier"],
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "ecmaVersion": 2021,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["react-native"],
  "rules": {
    "react-native/no-unused-styles": "warn"
  }
}
```

### Step 1.7: Add Package.json Scripts

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --fix",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android"
  }
}
```

**Checkpoint**:

- ✅ Project initialized with proper folder structure
- ✅ Navigation skeleton in place
- ✅ Core dependencies installed
- ✅ Environment configuration ready

---

## Phase 2: Authentication (Google OAuth)

### Step 2.1: Configure Google OAuth

**For iOS:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Create OAuth 2.0 credentials (iOS app type)
4. Download the configuration (you'll need the Client ID)
5. Get your iOS Bundle ID from `app.json` (e.g., `com.yourname.mf394mobile`)

**For Android:**

1. In the same Google Cloud Console project
2. Create OAuth 2.0 credentials (Android app type)
3. Get your Android package name from `app.json`
4. Get your SHA-1 fingerprint:

   ```bash
   # Generate keystore (if you don't have one)
   keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

   # Get SHA-1
   keytool -list -v -keystore my-release-key.jks
   ```

5. Add SHA-1 to Google Cloud Console

### Step 2.2: Install & Configure Google Sign-In

```bash
npm install @react-native-google-signin/google-signin
```

If using Expo:

```bash
npx expo prebuild --clean
```

If using bare React Native:

```bash
cd ios && pod install && cd ..
```

### Step 2.3: Create AuthContext

Create `src/context/AuthContext.js`:

```javascript
import React, { createContext, useEffect, useState } from "react";
import * as GoogleSignIn from "@react-native-google-signin/google-signin";
import { GOOGLE_OAUTH_CLIENT_ID_iOS } from "@env";
import axios from "axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    GoogleSignIn.configure({
      webClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
      iosClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
    });
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Check if already signed in
      const isSignedIn = await GoogleSignIn.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignIn.getCurrentUser();
        if (userInfo) {
          setUser(userInfo.user);
        }
      }
    } catch (e) {
      console.log("Failed to restore token", e);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    signIn: async (credentials) => {
      try {
        setIsLoading(true);
        const userInfo = await GoogleSignIn.signIn();
        const { idToken } = userInfo;

        // Send token to your backend for validation
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          idToken,
        });

        // Store tokens securely (use react-native-secure-store)
        await SecureStore.setItemAsync(
          "accessToken",
          response.data.accessToken,
        );
        await SecureStore.setItemAsync(
          "refreshToken",
          response.data.refreshToken,
        );

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
        await GoogleSignIn.signOut();
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        setUser(null);
      } catch (e) {
        setError(e.message);
      }
    },

    signUp: async (credentials) => {
      // Similar to signIn for new users
      return authContext.signIn(credentials);
    },

    user,
    isLoading,
    error,
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}
```

### Step 2.4: Create LoginScreen

Create `src/screens/Auth/LoginScreen.js`:

```javascript
import React, { useContext, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import GoogleSignInButton from "../../components/UI/GoogleSignInButton";

export default function LoginScreen() {
  const { signIn, isLoading, error } = useContext(AuthContext);
  const [localError, setLocalError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setLocalError(null);
      await signIn();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Face Memorizer</Text>
        <Text style={styles.subtitle}>Remember every face you meet</Text>
      </View>

      {(error || localError) && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error || localError}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#4285F4" />
        ) : (
          <GoogleSignInButton onPress={handleGoogleSignIn} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  errorBox: {
    backgroundColor: "#ffebee",
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  errorText: {
    color: "#c62828",
  },
  buttonContainer: {
    width: "100%",
    marginBottom: 40,
  },
});
```

### Step 2.5: Create Secure Token Storage

Install secure storage:

```bash
npm install react-native-secure-store
```

Create `src/utils/secureStore.js`:

```javascript
import * as SecureStore from "react-native-secure-store";

export const tokenStorage = {
  async getAccessToken() {
    try {
      return await SecureStore.getItem("accessToken");
    } catch (e) {
      console.log("Error retrieving access token", e);
      return null;
    }
  },

  async setAccessToken(token) {
    try {
      await SecureStore.setItem("accessToken", token);
    } catch (e) {
      console.log("Error storing access token", e);
    }
  },

  async getRefreshToken() {
    try {
      return await SecureStore.getItem("refreshToken");
    } catch (e) {
      console.log("Error retrieving refresh token", e);
      return null;
    }
  },

  async setRefreshToken(token) {
    try {
      await SecureStore.setItem("refreshToken", token);
    } catch (e) {
      console.log("Error storing refresh token", e);
    }
  },

  async clearTokens() {
    try {
      await SecureStore.removeItem("accessToken");
      await SecureStore.removeItem("refreshToken");
    } catch (e) {
      console.log("Error clearing tokens", e);
    }
  },
};
```

**Checkpoint**:

- ✅ Google OAuth configured for iOS & Android
- ✅ AuthContext with login/logout
- ✅ LoginScreen UI
- ✅ Secure token storage

---

## Phase 3: API Integration

### Step 3.1: Create API Service

Create `src/services/apiClient.js`:

```javascript
import axios from "axios";
import { tokenStorage } from "../utils/secureStore";
import { API_BASE_URL, API_TIMEOUT } from "@env";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(API_TIMEOUT) || 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          await tokenStorage.setAccessToken(response.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        throw refreshError;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
```

### Step 3.2: Create Contact Service

Create `src/services/contactService.js`:

```javascript
import apiClient from "./apiClient";

export const contactService = {
  async getContacts() {
    try {
      const response = await apiClient.get("/api/contacts");
      return response.data.contacts || [];
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw error;
    }
  },

  async createContact(contactData) {
    try {
      const response = await apiClient.post("/api/contacts", contactData);
      return response.data.contact;
    } catch (error) {
      console.error("Error creating contact:", error);
      throw error;
    }
  },

  async updateContact(contactId, contactData) {
    try {
      const response = await apiClient.put(
        `/api/contacts/${contactId}`,
        contactData,
      );
      return response.data.contact;
    } catch (error) {
      console.error("Error updating contact:", error);
      throw error;
    }
  },

  async deleteContact(contactId) {
    try {
      await apiClient.delete(`/api/contacts/${contactId}`);
      return true;
    } catch (error) {
      console.error("Error deleting contact:", error);
      throw error;
    }
  },

  async getTags() {
    try {
      const response = await apiClient.get("/api/tags");
      return response.data.tags || [];
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },

  async createTag(tagName) {
    try {
      const response = await apiClient.post("/api/tags", { name: tagName });
      return response.data.tag;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  },

  async deleteTag(tagId) {
    try {
      await apiClient.delete(`/api/tags/${tagId}`);
      return true;
    } catch (error) {
      console.error("Error deleting tag:", error);
      throw error;
    }
  },
};
```

### Step 3.3: Create Image Upload Service

Create `src/services/imageService.js`:

```javascript
import apiClient from "./apiClient";

export const imageService = {
  async uploadImage(imageUri, contactId = null) {
    try {
      const formData = new FormData();

      // Read image file
      const response = await fetch(imageUri);
      const blob = await response.blob();

      formData.append("image", blob, "photo.jpg");
      if (contactId) {
        formData.append("contactId", contactId);
      }

      const result = await apiClient.post("/api/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return result.data.imageUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  async uploadBatchImages(imageUris) {
    try {
      const uploadPromises = imageUris.map((uri) => this.uploadImage(uri));
      return Promise.all(uploadPromises);
    } catch (error) {
      console.error("Error batch uploading images:", error);
      throw error;
    }
  },
};
```

### Step 3.4: Create Game Service

Create `src/services/gameService.js`:

```javascript
import apiClient from "./apiClient";

export const gameService = {
  async getGameContacts(tags = []) {
    try {
      const params = tags.length > 0 ? { tags: tags.join(",") } : {};
      const response = await apiClient.get("/api/game-contacts", { params });
      return response.data.contacts || [];
    } catch (error) {
      console.error("Error fetching game contacts:", error);
      throw error;
    }
  },

  async recordQuizScore(score, totalQuestions, tags = []) {
    try {
      const response = await apiClient.post("/api/quiz-score", {
        score,
        totalQuestions,
        tags,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      console.error("Error recording quiz score:", error);
      throw error;
    }
  },

  async getStats() {
    try {
      const response = await apiClient.get("/api/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  },
};
```

**Checkpoint**:

- ✅ API client with interceptors
- ✅ Token refresh mechanism
- ✅ Contact service for CRUD
- ✅ Image upload service
- ✅ Game service

---

## Phase 4: Core Data Management

### Step 4.1: Create ContactsContext

Create `src/context/ContactsContext.js`:

```javascript
import React, { createContext, useReducer, useCallback } from "react";
import { contactService } from "../services/contactService";

export const ContactsContext = createContext();

const initialState = {
  contacts: [],
  tags: [],
  filteredByTags: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

function contactsReducer(state, action) {
  switch (action.type) {
    case "SET_CONTACTS":
      return {
        ...state,
        contacts: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_CONTACT":
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
      };

    case "UPDATE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c._id === action.payload._id ? action.payload : c,
        ),
      };

    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c._id !== action.payload),
      };

    case "SET_TAGS":
      return {
        ...state,
        tags: action.payload,
      };

    case "ADD_TAG":
      return {
        ...state,
        tags: [...state.tags, action.payload],
      };

    case "DELETE_TAG":
      return {
        ...state,
        tags: state.tags.filter((t) => t._id !== action.payload),
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "FILTER_BY_TAGS":
      return {
        ...state,
        filteredByTags: action.payload,
      };

    default:
      return state;
  }
}

export function ContactsProvider({ children }) {
  const [state, dispatch] = useReducer(contactsReducer, initialState);

  // Load contacts
  const loadContacts = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const contacts = await contactService.getContacts();
      dispatch({ type: "SET_CONTACTS", payload: contacts });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // Create contact
  const createContact = useCallback(async (contactData) => {
    try {
      const newContact = await contactService.createContact(contactData);
      dispatch({ type: "ADD_CONTACT", payload: newContact });
      return newContact;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  // Update contact
  const updateContact = useCallback(async (contactId, contactData) => {
    try {
      const updatedContact = await contactService.updateContact(
        contactId,
        contactData,
      );
      dispatch({ type: "UPDATE_CONTACT", payload: updatedContact });
      return updatedContact;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  // Delete contact
  const deleteContact = useCallback(async (contactId) => {
    try {
      await contactService.deleteContact(contactId);
      dispatch({ type: "DELETE_CONTACT", payload: contactId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  // Load tags
  const loadTags = useCallback(async () => {
    try {
      const tags = await contactService.getTags();
      dispatch({ type: "SET_TAGS", payload: tags });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  // Filter by tags
  const filterByTags = useCallback((tagIds) => {
    dispatch({ type: "FILTER_BY_TAGS", payload: tagIds });
  }, []);

  // Get filtered contacts
  const getFilteredContacts = useCallback(() => {
    if (state.filteredByTags.length === 0) {
      return state.contacts;
    }

    return state.contacts.filter((contact) =>
      state.filteredByTags.some((tagId) => contact.groups?.includes(tagId)),
    );
  }, [state.contacts, state.filteredByTags]);

  const value = {
    ...state,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    loadTags,
    filterByTags,
    getFilteredContacts,
  };

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}
```

### Step 4.2: Create Custom Hooks

Create `src/hooks/useContacts.js`:

```javascript
import { useContext } from "react";
import { ContactsContext } from "../context/ContactsContext";

export function useContacts() {
  const context = useContext(ContactsContext);

  if (!context) {
    throw new Error("useContacts must be used within ContactsProvider");
  }

  return context;
}
```

Create `src/hooks/useAuth.js`:

```javascript
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
```

### Step 4.3: Create App Root Component

Update `src/App.js`:

```javascript
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./context/AuthContext";
import { ContactsProvider } from "./context/ContactsContext";
import { RootNavigator } from "./navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <ContactsProvider>
        <RootNavigator />
        <StatusBar barStyle="dark-content" />
      </ContactsProvider>
    </AuthProvider>
  );
}
```

**Checkpoint**:

- ✅ ContactsContext with reducer
- ✅ Custom hooks for context access
- ✅ App root with providers
- ✅ State management foundation

---

## Phase 5: Image Handling & Face Detection

### Step 5.1: Install Face Detection Library

```bash
npm install @react-native-ml-kit/face-detection
```

For Expo:

```bash
npx expo prebuild --clean
```

### Step 5.2: Create Face Detection Hook

Create `src/hooks/useFaceDetection.js`:

```javascript
import { useState, useCallback } from "react";
import { processCameraFrame } from "@react-native-ml-kit/face-detection";
import { FACE_DETECTION_MIN_CONFIDENCE } from "@env";

export function useFaceDetection() {
  const [faces, setFaces] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  const detectFaces = useCallback(async (imageUri) => {
    setIsDetecting(true);
    setError(null);

    try {
      // Load image
      const image = new MLKitImage(imageUri);

      // Detect faces
      const detectedFaces = await image.detectFaces({
        minConfidence: parseFloat(FACE_DETECTION_MIN_CONFIDENCE) || 0.5,
        performanceMode: "fast",
        landmarkMode: "all",
        contourMode: "all",
      });

      if (detectedFaces.length > 0) {
        setFaces(detectedFaces);
        return detectedFaces;
      } else {
        setError("No faces detected. Please try another image.");
        return [];
      }
    } catch (err) {
      setError(err.message || "Face detection failed");
      return [];
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const clearFaces = useCallback(() => {
    setFaces([]);
    setError(null);
  }, []);

  return {
    faces,
    isDetecting,
    error,
    detectFaces,
    clearFaces,
  };
}
```

### Step 5.3: Create Image Processing Utilities

Create `src/utils/imageProcessing.js`:

```javascript
import * as ImageManipulator from "expo-image-manipulator";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";

export const imageProcessing = {
  async cropImage(imageUri, cropData) {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropData.x,
              originY: cropData.y,
              width: cropData.width,
              height: cropData.height,
            },
          },
          { resize: { width: 500, height: 500 } },
        ],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      return manipResult.uri;
    } catch (error) {
      console.error("Error cropping image:", error);
      throw error;
    }
  },

  async resizeImage(imageUri, width = 500, height = 500) {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width, height } }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG },
      );

      return manipResult.uri;
    } catch (error) {
      console.error("Error resizing image:", error);
      throw error;
    }
  },

  async extractFaceFromBounds(imageUri, faceBounds) {
    // Extract face region using bounds from ML Kit
    const cropData = {
      x: Math.max(0, faceBounds.left - 10),
      y: Math.max(0, faceBounds.top - 10),
      width: Math.min(faceBounds.width + 20, faceBounds.width),
      height: Math.min(faceBounds.height + 20, faceBounds.height),
    };

    return this.cropImage(imageUri, cropData);
  },
};
```

### Step 5.4: Create ImageUploadScreen

Create `src/screens/ImageHandling/ImageUploadScreen.js`:

```javascript
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

export default function ImageUploadScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission required");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const handleContinue = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      // Navigate to face detection screen with image URI
      navigation.navigate("FaceDetection", { imageUri: image });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
            <Text style={styles.changeButtonText}>Change Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadArea}>
          <Text style={styles.title}>Upload Photo</Text>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Pick from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.buttonText}>Take a Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {image && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Detect Faces</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  uploadArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  previewContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  changeButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  changeButtonText: {
    color: "#333",
    fontWeight: "500",
  },
  continueButton: {
    backgroundColor: "#34A853",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
```

### Step 5.5: Create FaceDetectionScreen

Create `src/screens/ImageHandling/FaceDetectionScreen.js`:

```javascript
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFaceDetection } from "../../hooks/useFaceDetection";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function FaceDetectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { imageUri } = route.params || {};

  const { faces, isDetecting, error, detectFaces, clearFaces } =
    useFaceDetection();
  const [selectedFaces, setSelectedFaces] = useState([]);

  useEffect(() => {
    if (imageUri) {
      detectFaces(imageUri);
    }
  }, [imageUri]);

  const toggleFaceSelection = (faceIndex) => {
    setSelectedFaces((prev) => {
      if (prev.includes(faceIndex)) {
        return prev.filter((i) => i !== faceIndex);
      } else {
        return [...prev, faceIndex];
      }
    });
  };

  const handleManualCrop = () => {
    navigation.navigate("CropImage", { imageUri });
  };

  const handleContinue = () => {
    if (selectedFaces.length === 0) {
      Alert.alert("No Faces Selected", "Please select at least one face.");
      return;
    }

    // Pass selected face indices to next screen
    navigation.navigate("AddContact", {
      imageUri,
      selectedFaceIndices: selectedFaces,
      faces,
    });
  };

  if (isDetecting) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Detecting faces...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={handleManualCrop}>
          <Text style={styles.buttonText}>Manual Crop Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {faces.length} face(s) detected. Tap to select:
      </Text>

      <View style={styles.faceGrid}>
        {faces.map((face, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.faceCard,
              selectedFaces.includes(index) && styles.faceCardSelected,
            ]}
            onPress={() => toggleFaceSelection(index)}
          >
            <Image source={{ uri: imageUri }} style={styles.faceImage} />
            <View style={styles.faceIndex}>
              <Text style={styles.faceIndexText}>{index + 1}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>
          Continue with {selectedFaces.length} face(s)
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  faceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  faceCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  faceCardSelected: {
    borderColor: "#4285F4",
    borderWidth: 3,
  },
  faceImage: {
    width: "100%",
    height: "100%",
  },
  faceIndex: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#4285F4",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  faceIndexText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF9800",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "#34A853",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
```

**Checkpoint**:

- ✅ ML Kit face detection integrated
- ✅ Image upload & preview
- ✅ Face detection with UI
- ✅ Image cropping utilities

---

## Phase 6: Contact Management UI

### Step 6.1: Create HomeScreen

Create `src/screens/Home/HomeScreen.js`:

```javascript
import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useContacts } from "../../hooks/useContacts";
import ContactCard from "../../components/ContactCard";
import TagFilter from "../../components/TagFilter";
import HeaderBar from "../../components/HeaderBar";

export default function HomeScreen({ navigation }) {
  const {
    contacts,
    tags,
    isLoading,
    error,
    loadContacts,
    loadTags,
    filterByTags,
    getFilteredContacts,
  } = useContacts();

  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'summary', 'table'
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadContacts();
    loadTags();
  }, []);

  const filteredContacts = getFilteredContacts();

  const handleAddContact = () => {
    navigation.navigate("ImageUpload");
  };

  const handleContactPress = (contact) => {
    navigation.navigate("EditContact", { contact });
  };

  const handleTagSelect = (tagId) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    filterByTags(newTags);
  };

  const renderContactCard = ({ item }) => (
    <TouchableOpacity onPress={() => handleContactPress(item)}>
      <ContactCard contact={item} viewMode={viewMode} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderBar title="Contacts" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadContacts} />
        }
      >
        <TagFilter
          tags={tags}
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
        />

        <View style={styles.viewModeToggle}>
          {["grid", "summary"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={styles.viewModeText}>{mode}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No contacts yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddContact}
            >
              <Text style={styles.addButtonText}>Add Your First Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContactCard}
            keyExtractor={(item) => item._id}
            numColumns={viewMode === "grid" ? 2 : 1}
            scrollEnabled={false}
            columnWrapperStyle={
              viewMode === "grid" ? styles.columnWrapper : null
            }
          />
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddContact}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  viewModeToggle: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 12,
    gap: 10,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: "#4285F4",
  },
  viewModeText: {
    fontWeight: "600",
    color: "#333",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#999",
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
  },
});
```

### Step 6.2: Create ContactCard Component

Create `src/components/ContactCard.js`:

```javascript
import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const cardWidth = (width - 60) / 2; // Account for padding and gap

export default function ContactCard({ contact, viewMode = "grid" }) {
  if (viewMode === "summary") {
    return (
      <View style={styles.summaryCard}>
        {contact.photo && (
          <Image source={{ uri: contact.photo }} style={styles.summaryImage} />
        )}
        <Text style={styles.summaryName} numberOfLines={1}>
          {contact.name}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.gridCard}>
      {contact.photo ? (
        <Image source={{ uri: contact.photo }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={2}>
          {contact.name}
        </Text>
        {contact.groups && contact.groups.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {contact.groups.join(", ")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: cardWidth,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: cardWidth,
    backgroundColor: "#e0e0e0",
  },
  imagePlaceholder: {
    width: "100%",
    height: cardWidth,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
  },
  cardContent: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  tags: {
    fontSize: 12,
    color: "#999",
  },
  summaryCard: {
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 12,
  },
  summaryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e0e0",
    marginBottom: 8,
  },
  summaryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: 100,
    textAlign: "center",
  },
});
```

### Step 6.3: Create TagFilter Component

Create `src/components/TagFilter.js`:

```javascript
import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

export default function TagFilter({ tags, selectedTags, onTagSelect }) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag._id}
          style={[
            styles.chip,
            selectedTags.includes(tag._id) && styles.chipSelected,
          ]}
          onPress={() => onTagSelect(tag._id)}
        >
          <Text
            style={[
              styles.chipText,
              selectedTags.includes(tag._id) && styles.chipTextSelected,
            ]}
          >
            {tag.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: "#4285F4",
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  chipTextSelected: {
    color: "#fff",
  },
});
```

**Checkpoint**:

- ✅ Home screen with contact list
- ✅ Grid/summary view toggle
- ✅ Tag filtering
- ✅ Contact cards component

---

## Phase 7: Game Implementation

### Step 7.1: Create Quiz Game Screen

Create `src/screens/Games/QuizGameScreen.js`:

```javascript
import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { gameService } from "../../services/gameService";
import { useContacts } from "../../hooks/useContacts";
import Shuffle from "../../utils/shuffle";

export default function QuizGameScreen() {
  const { tags } = useContacts();
  const [contacts, setContacts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadGameContacts();
  }, []);

  const loadGameContacts = async () => {
    try {
      setIsLoading(true);
      const gameContacts = await gameService.getGameContacts(selectedTags);
      if (gameContacts.length > 0) {
        setContacts(Shuffle(gameContacts));
      }
    } catch (error) {
      console.error("Error loading game contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentContact = () => contacts[currentIndex];

  const getMultipleChoice = () => {
    const current = getCurrentContact();
    const options = [current.name];

    while (options.length < 4) {
      const randomContact =
        contacts[Math.floor(Math.random() * contacts.length)];
      if (!options.includes(randomContact.name)) {
        options.push(randomContact.name);
      }
    }

    return Shuffle(options);
  };

  const handleAnswer = (answer) => {
    const isCorrect = answer === getCurrentContact().name;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex + 1 >= contacts.length) {
      setGameOver(true);
      gameService.recordQuizScore(
        score + (isCorrect ? 1 : 0),
        contacts.length,
        selectedTags,
      );
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setScore(0);
    setGameOver(false);
    loadGameContacts();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  if (contacts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No contacts available for quiz</Text>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Quiz Complete!</Text>
          <Text style={styles.resultScore}>
            {score} / {contacts.length}
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const current = getCurrentContact();
  const options = getMultipleChoice();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>
          {currentIndex + 1} / {contacts.length}
        </Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      {current.photo && (
        <Image source={{ uri: current.photo }} style={styles.image} />
      )}

      <Text style={styles.question}>Who is this?</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  header: {
    position: "absolute",
    top: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 30,
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  optionsContainer: {
    width: "100%",
    gap: 12,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  resultBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4285F4",
    marginBottom: 30,
  },
  resetButton: {
    backgroundColor: "#34A853",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
```

### Step 7.2: Create Practice Game Screen

Create `src/screens/Games/PracticeGameScreen.js`:

```javascript
import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { gameService } from "../../services/gameService";
import { useContacts } from "../../hooks/useContacts";
import Shuffle from "../../utils/shuffle";

export default function PracticeGameScreen() {
  const [contacts, setContacts] = useState([]);
  const [images, setImages] = useState([]);
  const [names, setNames] = useState([]);
  const [matched, setMatched] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadGameContacts();
  }, []);

  const loadGameContacts = async () => {
    try {
      setIsLoading(true);
      const gameContacts = await gameService.getGameContacts(selectedTags);
      if (gameContacts.length > 0) {
        const shuffled = Shuffle(gameContacts);
        setContacts(shuffled);
        setImages(shuffled.map((c) => c._id));
        setNames(Shuffle(shuffled).map((c) => c.name));
      }
    } catch (error) {
      console.error("Error loading game contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (contactId) => {
    setSelectedImage(contactId);
  };

  const handleNameSelect = (name) => {
    if (!selectedImage) return;

    const contact = contacts.find((c) => c._id === selectedImage);
    if (contact.name === name && !matched.includes(contact._id)) {
      setMatched((prev) => [...prev, contact._id]);
      setSelectedImage(null);

      if (matched.length + 1 === contacts.length) {
        // Game won!
        setTimeout(() => alert("Congratulations!"), 500);
      }
    } else {
      setSelectedImage(null);
    }
  };

  const handleReset = () => {
    loadGameContacts();
    setMatched([]);
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4285F4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      <ScrollView horizontal style={styles.imageColumn}>
        {images
          .filter((id) => !matched.includes(id))
          .map((contactId) => {
            const contact = contacts.find((c) => c._id === contactId);
            return (
              <TouchableOpacity
                key={contactId}
                style={[
                  styles.imageCard,
                  selectedImage === contactId && styles.imageCardSelected,
                ]}
                onPress={() => handleImageSelect(contactId)}
              >
                <Image source={{ uri: contact.photo }} style={styles.image} />
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      <View style={styles.nameColumn}>
        {names
          .filter((name) => {
            const contact = contacts.find((c) => c.name === name);
            return !matched.includes(contact._id);
          })
          .map((name, index) => (
            <TouchableOpacity
              key={index}
              style={styles.nameButton}
              onPress={() => handleNameSelect(name)}
            >
              <Text style={styles.nameText}>{name}</Text>
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  resetButton: {
    alignSelf: "flex-end",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 16,
  },
  resetButtonText: {
    fontWeight: "600",
    color: "#333",
  },
  imageColumn: {
    flex: 1,
    marginRight: 20,
  },
  imageCard: {
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  imageCardSelected: {
    borderColor: "#4285F4",
    borderWidth: 3,
  },
  image: {
    width: 120,
    height: 120,
    backgroundColor: "#e0e0e0",
  },
  nameColumn: {
    flex: 1,
    justifyContent: "space-around",
  },
  nameButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
});
```

**Checkpoint**:

- ✅ Quiz game with multiple choice
- ✅ Practice game with drag-drop concept
- ✅ Score tracking
- ✅ Game reset functionality

---

## Phase 8: Testing

### Step 8.1: Set Up Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: "react-native",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  moduleNameMapper: {
    "^@env$": "<rootDir>/__tests__/mocks/env.mock.js",
  },
  collectCoverageFrom: ["src/**/*.js", "!src/**/*.test.js", "!src/**/index.js"],
};
```

### Step 8.2: Create Test Setup

Create `__tests__/setup.js`:

```javascript
import "@testing-library/jest-dom";
```

Create `__tests__/mocks/env.mock.js`:

```javascript
module.exports = {
  GOOGLE_OAUTH_CLIENT_ID_iOS: "test-client-id",
  API_BASE_URL: "http://localhost:3000",
  API_TIMEOUT: "30000",
  FACE_DETECTION_MIN_CONFIDENCE: "0.5",
};
```

### Step 8.3: Create Service Tests

Create `__tests__/services/contactService.test.js`:

```javascript
import { contactService } from "../../src/services/contactService";
import apiClient from "../../src/services/apiClient";

jest.mock("../../src/services/apiClient");

describe("contactService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getContacts", () => {
    it("should fetch contacts successfully", async () => {
      const mockContacts = [
        { _id: "1", name: "John" },
        { _id: "2", name: "Jane" },
      ];

      apiClient.get.mockResolvedValue({
        data: { contacts: mockContacts },
      });

      const result = await contactService.getContacts();

      expect(apiClient.get).toHaveBeenCalledWith("/api/contacts");
      expect(result).toEqual(mockContacts);
    });

    it("should return empty array if no contacts", async () => {
      apiClient.get.mockResolvedValue({ data: { contacts: null } });

      const result = await contactService.getContacts();

      expect(result).toEqual([]);
    });

    it("should handle error", async () => {
      const error = new Error("Network error");
      apiClient.get.mockRejectedValue(error);

      await expect(contactService.getContacts()).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("createContact", () => {
    it("should create a contact", async () => {
      const contactData = { name: "Bob", groups: [] };
      const mockContact = { _id: "3", ...contactData };

      apiClient.post.mockResolvedValue({
        data: { contact: mockContact },
      });

      const result = await contactService.createContact(contactData);

      expect(apiClient.post).toHaveBeenCalledWith("/api/contacts", contactData);
      expect(result).toEqual(mockContact);
    });
  });

  describe("deleteContact", () => {
    it("should delete a contact", async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await contactService.deleteContact("1");

      expect(apiClient.delete).toHaveBeenCalledWith("/api/contacts/1");
      expect(result).toBe(true);
    });
  });
});
```

### Step 8.4: Create Component Tests

Create `__tests__/components/ContactCard.test.js`:

```javascript
import React from "react";
import { render } from "@testing-library/react-native";
import ContactCard from "../../src/components/ContactCard";

describe("ContactCard", () => {
  const mockContact = {
    _id: "1",
    name: "John Doe",
    photo: "http://example.com/photo.jpg",
    groups: ["friends", "work"],
  };

  it("renders contact name", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} viewMode="grid" />,
    );

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders tags", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} viewMode="grid" />,
    );

    expect(getByText("friends, work")).toBeTruthy();
  });

  it("renders in summary mode", () => {
    const { getByText } = render(
      <ContactCard contact={mockContact} viewMode="summary" />,
    );

    expect(getByText("John Doe")).toBeTruthy();
  });

  it("renders placeholder when no photo", () => {
    const contactNoPhoto = { ...mockContact, photo: null };
    const { getByText } = render(
      <ContactCard contact={contactNoPhoto} viewMode="grid" />,
    );

    expect(getByText("No Image")).toBeTruthy();
  });
});
```

### Step 8.5: Create Context Tests

Create `__tests__/context/ContactsContext.test.js`:

```javascript
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import {
  ContactsProvider,
  ContactsContext,
} from "../../src/context/ContactsContext";
import * as contactService from "../../src/services/contactService";

jest.mock("../../src/services/contactService");

describe("ContactsContext", () => {
  it("loads contacts on mount", async () => {
    const mockContacts = [{ _id: "1", name: "John" }];
    contactService.getContacts.mockResolvedValue(mockContacts);

    let contextValue;
    const TestComponent = () => {
      contextValue = React.useContext(ContactsContext);
      return null;
    };

    render(
      <ContactsProvider>
        <TestComponent />
      </ContactsProvider>,
    );

    await waitFor(() => {
      expect(contextValue.contacts).toEqual(mockContacts);
    });
  });

  it("handles create contact", async () => {
    const mockContact = { _id: "1", name: "John" };
    contactService.createContact.mockResolvedValue(mockContact);

    let contextValue;
    const TestComponent = () => {
      contextValue = React.useContext(ContactsContext);
      return null;
    };

    render(
      <ContactsProvider>
        <TestComponent />
      </ContactsProvider>,
    );

    await waitFor(() => {
      contextValue.createContact({ name: "John" });
    });

    await waitFor(() => {
      expect(contextValue.contacts).toContainEqual(mockContact);
    });
  });
});
```

**Checkpoint**:

- ✅ Jest configuration
- ✅ Service unit tests
- ✅ Component tests
- ✅ Context tests

---

## Phase 9: Polish & Deployment

### Step 9.1: Theme Configuration

Create `src/styles/theme.js`:

```javascript
export const theme = {
  colors: {
    primary: "#4285F4",
    secondary: "#34A853",
    error: "#d32f2f",
    background: "#fff",
    surface: "#f9f9f9",
    text: "#333",
    textSecondary: "#666",
    border: "#f0f0f0",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
    },
  },
};
```

### Step 9.2: Configure Expo Build

Create `eas.json`:

```json
{
  "build": {
    "production": {
      "node": "20.x",
      "npm": "10.x"
    },
    "preview": {
      "node": "20.x",
      "npm": "10.x"
    },
    "development": {
      "node": "20.x",
      "npm": "10.x",
      "developmentClient": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_APP_ID"
      },
      "android": {
        "serviceAccount": "path/to/service-account.json"
      }
    }
  }
}
```

### Step 9.3: App Configuration

Update `app.json`:

```json
{
  "expo": {
    "name": "Face Memorizer",
    "slug": "face-memorizer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.yourname.facememorizer",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourname.facememorizer",
      "versionCode": 1
    },
    "plugins": [
      "@react-native-google-signin/google-signin",
      "@react-native-ml-kit/face-detection"
    ]
  }
}
```

### Step 9.4: Build & Deploy

```bash
# Login to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

### Step 9.5: Performance Optimization

Key optimization strategies:

1. **Lazy loading**: Load screens only when needed
2. **Image optimization**: Use react-native-fast-image for caching
3. **State management**: Consider Redux or Zustand for complex state
4. **Memory management**: Clean up subscriptions and listeners
5. **Code splitting**: Use dynamic imports for large bundles

**Checkpoint**:

- ✅ Theme & styling system
- ✅ Expo build configuration
- ✅ iOS & Android configuration
- ✅ Deployment process

---

## Implementation Checklist

### Phase 1: Setup

- [ ] React Native project created
- [ ] Dependencies installed
- [ ] Project structure organized
- [ ] Environment variables configured
- [ ] Navigation skeleton created

### Phase 2: Authentication

- [ ] Google OAuth configured (iOS & Android)
- [ ] AuthContext implemented
- [ ] LoginScreen UI created
- [ ] Token storage implemented
- [ ] Session management working

### Phase 3: API Integration

- [ ] API client with interceptors
- [ ] Token refresh mechanism
- [ ] All services created (contacts, images, games)
- [ ] Error handling implemented

### Phase 4: Data Management

- [ ] ContactsContext & reducer
- [ ] Custom hooks created
- [ ] State persistence

### Phase 5: Image Handling

- [ ] ML Kit face detection integrated
- [ ] Image upload working
- [ ] Face detection UI complete
- [ ] Image processing utilities

### Phase 6: Contact Management

- [ ] HomeScreen with contacts list
- [ ] ContactCard component
- [ ] Tag filtering
- [ ] Add/Edit/Delete UI

### Phase 7: Games

- [ ] Quiz game implemented & tested
- [ ] Practice game implemented & tested
- [ ] Game screens navigation

### Phase 8: Testing

- [ ] Service tests (70%+ coverage)
- [ ] Component tests
- [ ] Context tests
- [ ] Integration tests

### Phase 9: Polish & Deploy

- [ ] Theme system applied
- [ ] Performance optimized
- [ ] EAS build configured
- [ ] iOS build successful
- [ ] Android build successful
- [ ] App Store submission ready
- [ ] Google Play submission ready

---

## Common Issues & Solutions

### Issue: Face Detection Returns Empty

**Solution**: Check that minimum confidence isn't too high; ensure image quality is good; try different `min Confidence` value

### Issue: Google OAuth Token Invalid

**Solution**: Verify Client ID matches platform (iOS/Android); check redirect URIs configured in Google Cloud; ensure proper scopes requested

### Issue: Image Upload Fails

**Solution**: Check file size limits on API; verify FormData implementation; ensure CORS headers if cross-domain

### Issue: Navigation Not Working

**Solution**: Ensure providers are wrapping navigators; check screen names match; verify params passed correctly

### Issue: Context Value Undefined

**Solution**: Ensure Provider wraps component; check context not used outside Provider; verify useContext hook used correctly

---

## Next Steps After MVP

1.
2. **Offline Support**: Add AsyncStorage for caching
3.
4.
5. **Advanced Face Matching**: Recognize faces in new images
6. **Accessibility**: Add voice controls, screen reader support
7. **Performance**: Code splitting, lazy loading, caching strategies

---

## API Endpoints Needed

Your backend should provide these endpoints:

```
POST   /auth/login              - Google OAuth validation
POST   /auth/refresh            - Token refresh
GET    /api/contacts            - Get all user contacts
POST   /api/contacts            - Create contact
PUT    /api/contacts/:id        - Update contact
DELETE /api/contacts/:id        - Delete contact
GET    /api/tags                - Get all tags
POST   /api/tags                - Create tag
DELETE /api/tags/:id            - Delete tag
POST   /api/upload-image        - Upload image (multipart/form-data)
GET    /api/game-contacts       - Get contacts for game (with tag filter)
POST   /api/quiz-score          - Record quiz score
GET    /api/stats               - Get user statistics
```

---

## Resource Links

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [ML Kit Docs](https://developers.google.com/ml-kit/vision/face-detection)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)

---

## Support & Questions

As you implement this guide:

1. Reference your original Next.js app for UI/UX patterns
2. Test thoroughly on both iOS and Android simulators
3. Use React Native debugger for troubleshooting
4. Check React Native community forums for common issues
5. Refer to component library documentation for specific implementations

Good luck with your React Native implementation! 🚀

Make use of refactoring and creation of modular, reusable components.
Optimize for Google Play and App Store.
Rely on color schemes and visuals form Palette in the oriinal app.
