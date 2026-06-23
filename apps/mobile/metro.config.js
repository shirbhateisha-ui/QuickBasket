// Expo SDK 52+ auto-detects the monorepo; this just uses the default config.
// Kept explicit so the workspace setup is obvious and easy to extend later.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
