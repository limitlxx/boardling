/**
 * Withdrawals API Module
 */
export class WithdrawalsAPI {
    constructor(client: any);
    client: any;
    /**
     * Create a withdrawal request
     */
    create({ user_id, to_address, amount_zec }: {
        user_id: any;
        to_address: any;
        amount_zec: any;
    }): Promise<any>;
    /**
     * Process a withdrawal (admin function)
     */
    process(withdrawalId: any): Promise<any>;
    /**
     * Process multiple withdrawals at once
     */
    processBatch(withdrawalIds: any): Promise<any[]>;
    /**
     * Get fee estimate
     */
    getFeeEstimate(amount_zec: any): Promise<any>;
    /**
     * Get withdrawal by ID
     */
    getById(withdrawalId: any): Promise<any>;
    /**
     * List withdrawals for a user
     */
    listByUser(userId: any, options?: {}): Promise<any>;
}
