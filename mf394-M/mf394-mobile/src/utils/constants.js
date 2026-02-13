// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || "https://ummyou.com/api";
export const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || "30000", 10);

// Google OAuth Configuration
export const GOOGLE_OAUTH_CLIENT_ID_iOS = process.env.GOOGLE_OAUTH_CLIENT_ID_iOS;
export const GOOGLE_OAUTH_CLIENT_ID_Android = process.env.GOOGLE_OAUTH_CLIENT_ID_Android;
export const GOOGLE_OAUTH_WEB_CLIENT_ID = process.env.GOOGLE_OAUTH_WEB_CLIENT_ID;

// Face Detection Configuration
export const FACE_DETECTION_MIN_CONFIDENCE = parseFloat(process.env.FACE_DETECTION_MIN_CONFIDENCE || "0.5");

// API Endpoints
export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/login",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_LOGOUT: "/auth/logout",
  AUTH_ME: "/auth/me",
  CONTACTS: "/contacts",
  CONTACTS_BATCH: "/contacts/batch",
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
