/**
 * Users API Module
 */
export class UsersAPI {
    constructor(client: any);
    client: any;
    /**
     * Create a new user
     */
    create({ email, name }: {
        email: any;
        name: any;
    }): Promise<any>;
    /**
     * Get user by ID
     */
    getById(userId: any): Promise<any>;
    /**
     * Get user by email
     */
    getByEmail(email: any): Promise<any>;
    /**
     * Update user
     */
    update(userId: any, { email, name }: {
        email: any;
        name: any;
    }): Promise<any>;
    /**
     * Get user balance
     */
    getBalance(userId: any, options?: {}): Promise<any>;
    /**
     * List users with pagination
     */
    list(options?: {}): Promise<any>;
}
