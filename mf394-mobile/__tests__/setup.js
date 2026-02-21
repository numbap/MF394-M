import "@testing-library/jest-dom";

// Mock @react-native-google-signin/google-signin
try {
  require('@react-native-google-signin/google-signin/jest/build/setup');
} catch {
  jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest.fn(() => Promise.resolve()),
      signIn: jest.fn(() => Promise.resolve({ idToken: 'mock-id-token' })),
      signOut: jest.fn(() => Promise.resolve()),
    },
    statusCodes: {
      SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
      IN_PROGRESS: 'IN_PROGRESS',
      PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    },
  }));
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock @env
jest.mock("@env", () => ({
  GOOGLE_OAUTH_CLIENT_ID_iOS: "test-ios-id",
  GOOGLE_OAUTH_CLIENT_ID_Android: "test-android-id",
  GOOGLE_OAUTH_WEB_CLIENT_ID: "test-web-id",
  API_BASE_URL: "https://ummyou.com/api",
  API_TIMEOUT: "30000",
  FACE_DETECTION_MIN_CONFIDENCE: "0.5",
  AUTH_MOCK: "true",
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({
          sound: {
            setOnPlaybackStatusUpdate: jest.fn(),
            unloadAsync: jest.fn(),
          },
        })
      ),
    },
  },
}));
