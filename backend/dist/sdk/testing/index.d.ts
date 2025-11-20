/**
 * Testing utilities for Zcash Paywall SDK
 */
export function createMockDatabase(): {
    query: any;
    end: any;
};
export function createMockZcashRPC(): {
    getBlockchainInfo: any;
    generateZAddress: any;
    getReceivedByAddress: any;
    sendMany: any;
    validateAddress: any;
};
export class MockZcashPaywall {
    constructor(options?: {});
    testing: boolean;
    users: MockUsersAPI;
    invoices: MockInvoicesAPI;
    withdrawals: MockWithdrawalsAPI;
    admin: MockAdminAPI;
    initialize(): Promise<boolean>;
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        services: {
            database: string;
            zcash_rpc: string;
        };
    }>;
}
declare class MockUsersAPI {
    create({ email, name }: {
        email: any;
        name: any;
    }): Promise<{
        id: string;
        email: any;
        name: any;
        created_at: string;
    }>;
    getById(userId: any): Promise<{
        id: any;
        email: string;
        name: string;
        created_at: string;
    }>;
    getByEmail(email: any): Promise<{
        id: string;
        email: any;
        name: string;
        created_at: string;
    }>;
    getBalance(userId: any): Promise<{
        total_received_zec: number;
        total_withdrawn_zec: number;
        available_balance_zec: number;
    }>;
}
declare class MockInvoicesAPI {
    create({ user_id, type, amount_zec, item_id }: {
        user_id: any;
        type: any;
        amount_zec: any;
        item_id: any;
    }): Promise<{
        id: string;
        user_id: any;
        type: any;
        amount_zec: any;
        item_id: any;
        z_address: string;
        qr_code: string;
        payment_uri: string;
        status: string;
        created_at: string;
    }>;
    checkPayment(invoiceId: any): Promise<{
        paid: boolean;
        invoice: {
            id: any;
            status: string;
        };
    }>;
    getQRCode(invoiceId: any, options?: {}): Promise<"data:image/png;base64,mock-qr-code" | Buffer<ArrayBuffer>>;
}
declare class MockWithdrawalsAPI {
    create({ user_id, to_address, amount_zec }: {
        user_id: any;
        to_address: any;
        amount_zec: any;
    }): Promise<{
        id: string;
        user_id: any;
        to_address: any;
        amount_zec: any;
        status: string;
        requested_at: string;
    }>;
    getFeeEstimate(amount_zec: any): Promise<{
        amount: any;
        fee: number;
        net: number;
        feeBreakdown: {
            network_fee: number;
            platform_fee: number;
        };
    }>;
}
declare class MockAdminAPI {
    getStats(): Promise<{
        users: {
            total: number;
        };
        invoices: {
            paid: number;
            pending: number;
        };
        withdrawals: {
            completed: number;
            pending: number;
        };
        revenue: {
            total_zec: number;
        };
    }>;
    getNodeStatus(): Promise<{
        blocks: number;
        chain: string;
        connections: number;
    }>;
}
export {};
