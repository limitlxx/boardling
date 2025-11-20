/**
 * Retry utility with exponential backoff
 */
export function retryWithBackoff(fn: any, maxRetries?: number, baseDelay?: number): Promise<any>;
