const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable JSON file resolution
config.resolver.assetExts.push('json');

module.exports = config;
