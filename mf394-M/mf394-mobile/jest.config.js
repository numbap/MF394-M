module.exports = {
  preset: "react-native",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  moduleNameMapper: {
    "^@env$": "<rootDir>/__tests__/mocks/env.mock.js",
  },
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/index.js",
  ],
  testMatch: ["**/__tests__/**/*.test.js"],
};
