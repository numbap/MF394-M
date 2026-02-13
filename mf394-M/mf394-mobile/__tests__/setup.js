import "@testing-library/jest-dom";

// Mock @env
jest.mock("@env", () => ({
  GOOGLE_OAUTH_CLIENT_ID_iOS: "test-client-id",
  GOOGLE_OAUTH_CLIENT_ID_Android: "test-android-id",
  API_BASE_URL: "http://localhost:3000",
  API_TIMEOUT: "30000",
  FACE_DETECTION_MIN_CONFIDENCE: "0.5",
}));
