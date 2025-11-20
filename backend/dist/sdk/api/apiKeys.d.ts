/**
 * API Keys management API module
 */
export class ApiKeysAPI {
    constructor(client: any);
    client: any;
    /**
     * Create a new API key
     */
    create({ user_id, name, permissions, expires_in_days }: {
        user_id: any;
        name: any;
        permissions: any;
        expires_in_days: any;
    }): Promise<any>;
    /**
     * List API keys for a user
     */
    listByUser(userId: any): Promise<any>;
    /**
     * Get API key details
     */
    getById(keyId: any): Promise<any>;
    /**
     * Update API key
     */
    update(keyId: any, { name, permissions, is_active }: {
        name: any;
        permissions: any;
        is_active: any;
    }): Promise<any>;
    /**
     * Delete (deactivate) API key
     */
    delete(keyId: any): Promise<any>;
    /**
     * Regenerate API key
     */
    regenerate(keyId: any): Promise<any>;
}
