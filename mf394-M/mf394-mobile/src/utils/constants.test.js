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
} from "./constants";

describe("Environment Variables", () => {
  describe("API Configuration", () => {
    it("should load API_BASE_URL from .env", () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe("string");
      // In test environment, uses mock value or fallback
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
    });

    it("should load GOOGLE_OAUTH_CLIENT_ID_Android from .env", () => {
      expect(GOOGLE_OAUTH_CLIENT_ID_Android).toBeDefined();
      expect(typeof GOOGLE_OAUTH_CLIENT_ID_Android).toBe("string");
    });
  });

  describe("Face Detection Configuration", () => {
    it("should load FACE_DETECTION_MIN_CONFIDENCE from .env and parse to float", () => {
      expect(FACE_DETECTION_MIN_CONFIDENCE).toBeDefined();
      expect(typeof FACE_DETECTION_MIN_CONFIDENCE).toBe("number");
      expect(FACE_DETECTION_MIN_CONFIDENCE).toBe(0.5);
    });
  });
});
