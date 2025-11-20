"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultConfig = getDefaultConfig;
exports.getPreset = getPreset;
exports.getServerConfig = getServerConfig;
exports.presets = void 0;
exports.resolveConfig = resolveConfig;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * SDK Configuration Helper
 * Provides smart defaults for different environments
 */

/**
 * Get default configuration based on environment
 */
function getDefaultConfig() {
  // Try to detect environment
  const isNode = typeof process !== 'undefined' && process.env;
  const isBrowser = typeof window !== 'undefined';
  let defaultBaseUrl = 'http://localhost:3000';
  if (isNode) {
    // Server-side: Use environment variables
    defaultBaseUrl = process.env.SDK_DEFAULT_BASE_URL || process.env.API_BASE_URL || process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3000}`;
  } else if (isBrowser) {
    // Browser-side: Use current origin or common defaults
    if (window.location) {
      const {
        protocol,
        hostname,
        port
      } = window.location;
      const apiPort = port === '3000' ? '3000' : port || '80';
      defaultBaseUrl = `${protocol}//${hostname}:${apiPort}`;
    }
  }
  return {
    baseURL: defaultBaseUrl,
    timeout: 30000,
    apiVersion: 'v1'
  };
}

/**
 * Get server-side configuration (async)
 */
async function getServerConfig() {
  try {
    // Try to import server config if available (server-side only)
    const {
      config
    } = await Promise.resolve().then(() => _interopRequireWildcard(require('../config/appConfig.js')));
    return {
      baseURL: config.sdk.publicApiUrl,
      timeout: config.sdk.defaultTimeout,
      apiVersion: config.sdk.apiVersion
    };
  } catch (error) {
    // Not available or not server-side
    return null;
  }
}

/**
 * Resolve configuration with user overrides
 */
function resolveConfig(userConfig = {}) {
  const defaults = getDefaultConfig();
  return {
    baseURL: userConfig.baseURL || defaults.baseURL,
    timeout: userConfig.timeout || defaults.timeout,
    apiKey: userConfig.apiKey,
    apiVersion: userConfig.apiVersion || defaults.apiVersion,
    ...userConfig
  };
}

/**
 * Environment-specific presets
 */
const presets = exports.presets = {
  development: {
    baseURL: 'http://localhost:3000',
    timeout: 30000
  },
  production: {
    baseURL: 'https://api.your-domain.com',
    timeout: 15000
  },
  testing: {
    baseURL: 'http://localhost:3001',
    timeout: 5000
  }
};

/**
 * Get preset configuration
 */
function getPreset(environment) {
  return presets[environment] || presets.development;
}