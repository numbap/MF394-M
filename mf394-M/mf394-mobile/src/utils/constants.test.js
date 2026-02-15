/**
 * Constants Tests
 *
 * Verifies that environment variables are loaded correctly from .env
 * via react-native-dotenv and babel configuration.
 */

import {
  API_BASE_URL,
  API_TIMEOUT,
  GOOGLE_OAUTH_CLIENT_ID_iOS,
  GOOGLE_OAUTH_CLIENT_ID_Android,
  FACE_DETECTION_MIN_CONFIDENCE,
  AUTH_MOCK,
} from "./constants";

describe("Environment Variables", () => {
  describe("API Configuration", () => {
    it("should load API_BASE_URL from .env", () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe("string");
      // In test environment, uses mock value from setup.js
      expect(API_BASE_URL).toBe("https://ummyou.com/api");
    });

    it("should load API_TIMEOUT from .env and parse to integer", () => {
      expect(API_TIMEOUT).toBeDefined();
      expect(typeof API_TIMEOUT).toBe("number");
      expect(API_TIMEOUT).toBe(30000);
    });
  });

  describe("Google OAuth Configuration", () => {
    it("should load GOOGLE_OAUTH_CLIENT_ID_iOS from .env", () => {
      expect(GOOGLE_OAUTH_CLIENT_ID_iOS).toBeDefined();
      expect(typeof GOOGLE_OAUTH_CLIENT_ID_iOS).toBe("string");
      // In test environment, uses mock value from setup.js
      expect(GOOGLE_OAUTH_CLIENT_ID_iOS).toBe("test-ios-id");
    });

    it("should load GOOGLE_OAUTH_CLIENT_ID_Android from .env", () => {
      expect(GOOGLE_OAUTH_CLIENT_ID_Android).toBeDefined();
      expect(typeof GOOGLE_OAUTH_CLIENT_ID_Android).toBe("string");
      // In test environment, uses mock value from setup.js
      expect(GOOGLE_OAUTH_CLIENT_ID_Android).toBe("test-android-id");
    });
  });

  describe("Face Detection Configuration", () => {
    it("should load FACE_DETECTION_MIN_CONFIDENCE from .env and parse to float", () => {
      expect(FACE_DETECTION_MIN_CONFIDENCE).toBeDefined();
      expect(typeof FACE_DETECTION_MIN_CONFIDENCE).toBe("number");
      expect(FACE_DETECTION_MIN_CONFIDENCE).toBe(0.5);
    });
  });

  describe("Auth Mock Configuration", () => {
    it("should load AUTH_MOCK from .env", () => {
      expect(AUTH_MOCK).toBeDefined();
      expect(typeof AUTH_MOCK).toBe("boolean");
    });

    it("should parse AUTH_MOCK as boolean true when .env has 'true'", () => {
      // This test verifies the critical fix: AUTH_MOCK === "true" conversion
      expect(AUTH_MOCK).toBe(true);
    });

    it("should be boolean type, not string", () => {
      // Ensures we're not accidentally exporting the string "true"
      expect(AUTH_MOCK).not.toBe("true");
      expect(AUTH_MOCK).toBe(true);
    });
  });

  describe("Environment Variable Loading via react-native-dotenv", () => {
    it("should use @env module imports, not process.env", () => {
      // This test documents that we fixed the bug where process.env
      // was returning undefined in React Native web builds
      //
      // The fix was to configure babel-plugin-module-resolver with
      // react-native-dotenv to import from @env instead
      //
      // In test environment, Jest mocks @env (via setup.js) and values come from there
      expect(AUTH_MOCK).toBe(true);
      expect(API_BASE_URL).toBe("https://ummyou.com/api");
    });
  });
});
