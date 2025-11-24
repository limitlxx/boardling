"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.retryWithBackoff = retryWithBackoff;
/**
 * Retry utility with exponential backoff
 */

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on certain error types
      if (error.code === 'VALIDATION_ERROR' || error.code === 'NOT_FOUND' || error.code === 'UNAUTHORIZED') {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}