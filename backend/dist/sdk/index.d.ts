export class ZcashPaywall {
    /**
     * Create SDK instance with environment preset
     */
    static withPreset(environment: any, overrides?: {}): ZcashPaywall;
    /**
     * Create SDK instance with server-side defaults
     * This method tries to use server configuration if available
     */
    static withServerDefaults(overrides?: {}): Promise<ZcashPaywall>;
    /**
     * Create SDK instance by fetching configuration from a server
     */
    static fromServer(baseURL: any, overrides?: {}): Promise<ZcashPaywall>;
    constructor(options?: {});
    baseURL: any;
    apiKey: any;
    timeout: any;
    client: import("axios").AxiosInstance;
    users: UsersAPI;
    invoices: InvoicesAPI;
    withdrawals: WithdrawalsAPI;
    admin: AdminAPI;
    apiKeys: ApiKeysAPI;
    /**
     * Initialize the SDK (optional - for future use)
     */
    initialize(): Promise<boolean>;
    /**
     * Get API health status
     */
    getHealth(): Promise<any>;
    /**
     * Set API key for authentication
     */
    setApiKey(apiKey: any): void;
    /**
     * Remove API key
     */
    removeApiKey(): void;
    /**
     * Check if API key is set
     */
    hasApiKey(): boolean;
    /**
     * Map HTTP status codes to error codes
     */
    mapErrorCode(status: any, data: any): "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "ALREADY_EXISTS" | "INSUFFICIENT_BALANCE" | "INVALID_ADDRESS" | "RPC_ERROR" | "DATABASE_ERROR" | "FORBIDDEN" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL_ERROR" | "UNKNOWN_ERROR";
}
export { retryWithBackoff } from "./utils/retry.js";
export default ZcashPaywall;
import { UsersAPI } from './api/users.js';
import { InvoicesAPI } from './api/invoices.js';
import { WithdrawalsAPI } from './api/withdrawals.js';
import { AdminAPI } from './api/admin.js';
import { ApiKeysAPI } from './api/apiKeys.js';
export { resolveConfig, getPreset } from "./config.js";
