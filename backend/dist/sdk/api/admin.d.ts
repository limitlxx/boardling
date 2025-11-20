/**
 * Admin API Module
 */
export class AdminAPI {
    constructor(client: any);
    client: any;
    /**
     * Get platform statistics
     */
    getStats(): Promise<any>;
    /**
     * Get pending withdrawals
     */
    getPendingWithdrawals(): Promise<any>;
    /**
     * Get user balances
     */
    getUserBalances(options?: {}): Promise<any>;
    /**
     * Get revenue data
     */
    getRevenue(): Promise<any>;
    /**
     * Get active subscriptions
     */
    getActiveSubscriptions(): Promise<any>;
    /**
     * Get Zcash node status
     */
    getNodeStatus(): Promise<any>;
}
