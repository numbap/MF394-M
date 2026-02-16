import "@testing-library/jest-dom";

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
