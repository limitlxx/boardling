/**
 * SDK Configuration Helper
 * Provides smart defaults for different environments
 */
/**
 * Get default configuration based on environment
 */
export function getDefaultConfig(): {
    baseURL: string;
    timeout: number;
    apiVersion: string;
};
/**
 * Get server-side configuration (async)
 */
export function getServerConfig(): Promise<{
    baseURL: string;
    timeout: number;
    apiVersion: string;
} | null>;
/**
 * Resolve configuration with user overrides
 */
export function resolveConfig(userConfig?: {}): {
    baseURL: any;
    timeout: any;
    apiKey: any;
    apiVersion: any;
};
/**
 * Get preset configuration
 */
export function getPreset(environment: any): any;
export namespace presets {
    namespace development {
        let baseURL: string;
        let timeout: number;
    }
    namespace production {
        let baseURL_1: string;
        export { baseURL_1 as baseURL };
        let timeout_1: number;
        export { timeout_1 as timeout };
    }
    namespace testing {
        let baseURL_2: string;
        export { baseURL_2 as baseURL };
        let timeout_2: number;
        export { timeout_2 as timeout };
    }
}
