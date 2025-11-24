/**
 * Invoices API Module
 */
export class InvoicesAPI {
    constructor(client: any);
    client: any;
    /**
     * Create a new invoice
     */
    create({ user_id, type, amount_zec, item_id, email }: {
        user_id: any;
        type: any;
        amount_zec: any;
        item_id: any;
        email: any;
    }): Promise<any>;
    /**
     * Check payment status
     */
    checkPayment(invoiceId: any, options?: {}): Promise<any>;
    /**
     * Get invoice by ID
     */
    getById(invoiceId: any): Promise<any>;
    /**
     * Get QR code for invoice
     */
    getQRCode(invoiceId: any, options?: {}): Promise<any>;
    /**
     * Get payment URI
     */
    getPaymentURI(invoiceId: any): Promise<any>;
    /**
     * List invoices for a user
     */
    listByUser(userId: any, options?: {}): Promise<any>;
}
