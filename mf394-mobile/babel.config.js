module.exports = function (api) {
  api.cache(true);

  const plugins = [
    // Removed react-native-reanimated/plugin due to iOS compilation issues
  ];

  // Only add dotenv plugin when NOT in test environment
  // In test environment, Jest uses the mock from __tests__/mocks/env.mock.js
  if (process.env.NODE_ENV !== 'test') {
    plugins.unshift([
      "module:react-native-dotenv",
      {
        moduleName: "@env",
        path: ".env",
        safe: false,
        allowUndefined: true,
      },
    ]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
