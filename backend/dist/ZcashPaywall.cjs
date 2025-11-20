"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  ZcashPaywall: true,
  retryWithBackoff: true
};
Object.defineProperty(exports, "ZcashPaywall", {
  enumerable: true,
  get: function () {
    return _index.ZcashPaywall;
  }
});
exports.default = void 0;
Object.defineProperty(exports, "retryWithBackoff", {
  enumerable: true,
  get: function () {
    return _index.retryWithBackoff;
  }
});
var _index = require("./sdk/index.js");
var _index2 = require("./sdk/testing/index.js");
Object.keys(_index2).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _index2[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _index2[key];
    }
  });
});
/**
 * Standalone Zcash Paywall SDK - Main Entry Point
 * This is the main export for the NPM package
 */
// Default export for CommonJS compatibility
var _default = exports.default = _index.ZcashPaywall;