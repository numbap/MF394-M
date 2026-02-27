import {
  API_DOMAIN as ENV_API_DOMAIN,
  API_TIMEOUT as ENV_API_TIMEOUT,
  GOOGLE_OAUTH_CLIENT_ID_iOS as ENV_GOOGLE_OAUTH_CLIENT_ID_iOS,
  GOOGLE_OAUTH_CLIENT_ID_Android as ENV_GOOGLE_OAUTH_CLIENT_ID_Android,
  GOOGLE_OAUTH_WEB_CLIENT_ID as ENV_GOOGLE_OAUTH_WEB_CLIENT_ID,
  FACE_DETECTION_MIN_CONFIDENCE as ENV_FACE_DETECTION_MIN_CONFIDENCE,
} from "@env";

// API Configuration
export const API_BASE_URL = ENV_API_DOMAIN || "https://ummyou.com";
export const API_TIMEOUT = parseInt(ENV_API_TIMEOUT || "30000", 10);

// Google OAuth Configuration
export const GOOGLE_OAUTH_CLIENT_ID_iOS = ENV_GOOGLE_OAUTH_CLIENT_ID_iOS;
export const GOOGLE_OAUTH_CLIENT_ID_Android = ENV_GOOGLE_OAUTH_CLIENT_ID_Android;
export const GOOGLE_OAUTH_WEB_CLIENT_ID = ENV_GOOGLE_OAUTH_WEB_CLIENT_ID;

// Face Detection Configuration
export const FACE_DETECTION_MIN_CONFIDENCE = parseFloat(ENV_FACE_DETECTION_MIN_CONFIDENCE || "0.5");

// API Endpoints
export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/mobile-login",
  AUTH_ME: "/user",
  CONTACTS: "/contacts",
  CONTACTS_BULK: "/contacts/bulk",
  TAGS: "/tags",
  UPLOAD: "/upload",
  GAME_CONTACTS: "/game-contacts",
  QUIZ_SCORE: "/quiz-score",
  STATS: "/stats",
};

// Deprecated - use theme.ts instead
export const COLORS = {
  PRIMARY: "#547fab",
  SECONDARY: "#d4b82b",
  ERROR: "#dd4b22",
  WARNING: "#d4b82b",
  BACKGROUND: "#f5f3ef",
  SURFACE: "#ece7df",
  TEXT: "#181b1b",
  TEXT_SECONDARY: "#778588",
  BORDER: "#c8ced0",
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
};

export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  FULL: 999,
};
