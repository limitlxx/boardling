/**
 * Fetch SDK configuration from server
 */
export function fetchServerConfig(baseURL: any): Promise<any>;
/**
 * Create SDK instance with server-fetched configuration
 */
export function createWithServerConfig(baseURL: any, overrides?: {}): Promise<{
    baseURL: any;
    timeout: any;
    apiVersion: any;
} | {
    baseURL: any;
    timeout: number;
}>;
