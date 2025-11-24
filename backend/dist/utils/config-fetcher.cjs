"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createWithServerConfig = createWithServerConfig;
exports.fetchServerConfig = fetchServerConfig;
var _axios = _interopRequireDefault(require("axios"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Configuration fetcher utility
 * Fetches SDK configuration from the server
 */

/**
 * Fetch SDK configuration from server
 */
async function fetchServerConfig(baseURL) {
  try {
    const response = await _axios.default.get(`${baseURL}/api/config`, {
      timeout: 5000
    });
    return response.data.sdk;
  } catch (error) {
    // Return null if config fetch fails
    return null;
  }
}

/**
 * Create SDK instance with server-fetched configuration
 */
async function createWithServerConfig(baseURL, overrides = {}) {
  const serverConfig = await fetchServerConfig(baseURL);
  if (serverConfig) {
    return {
      baseURL: serverConfig.baseURL,
      timeout: serverConfig.timeout,
      apiVersion: serverConfig.apiVersion,
      ...overrides
    };
  }

  // Fallback to provided baseURL
  return {
    baseURL,
    timeout: 30000,
    ...overrides
  };
}