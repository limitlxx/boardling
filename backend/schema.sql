-- =====================================================
-- ZCASH PAYWALL SDK - PRODUCTION DATABASE SCHEMA
-- PostgreSQL - Ready for 100K+ users & $1M+ in ZEC volume
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 2. INVOICES TABLE (Subscriptions + One-time payments)
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'one_time')),
    item_id VARCHAR(255), -- video ID, course ID, etc.
    
    amount_zec DECIMAL(16,8) NOT NULL CHECK (amount_zec > 0),
    z_address VARCHAR(120) NOT NULL UNIQUE, -- zcash shielded address
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    
    paid_txid VARCHAR(64), -- Zcash transaction ID
    paid_amount_zec DECIMAL(16,8) CHECK (paid_amount_zec >= 0),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    expires_at TIMESTAMP WITH TIME ZONE, -- for subscriptions only
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_z_address ON invoices(z_address);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_expires_at ON invoices(expires_at);
CREATE INDEX idx_invoices_paid_at ON invoices(paid_at);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- =====================================================
-- 3. WITHDRAWALS TABLE (User cashouts with fees)
-- =====================================================
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount_zec DECIMAL(16,8) NOT NULL CHECK (amount_zec > 0), -- what user requested
    fee_zec DECIMAL(16,8) NOT NULL CHECK (fee_zec >= 0),      -- your platform fee
    net_zec DECIMAL(16,8) NOT NULL CHECK (net_zec > 0),       -- actually sent
    
    to_address VARCHAR(120) NOT NULL, -- user's z/t address
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    
    txid VARCHAR(64), -- Zcash transaction ID
    
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_to_address ON withdrawals(to_address);
CREATE INDEX idx_withdrawals_processed_at ON withdrawals(processed_at);

-- =====================================================
-- 4. TRIGGERS (Auto-update timestamps)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE
    ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. VIEWS (Handy queries for dashboards)
-- =====================================================

-- User balance view (payments received - withdrawals sent)
CREATE VIEW user_balances AS
SELECT 
    u.id,
    u.email,
    u.name,
    COALESCE(SUM(i.paid_amount_zec), 0) as total_received_zec,
    COALESCE(SUM(w.amount_zec), 0) as total_withdrawn_zec,
    COALESCE(SUM(i.paid_amount_zec), 0) - COALESCE(SUM(w.amount_zec), 0) as available_balance_zec,
    COUNT(i.id) as total_invoices,
    COUNT(w.id) as total_withdrawals
FROM users u
LEFT JOIN invoices i ON u.id = i.user_id AND i.status = 'paid'
LEFT JOIN withdrawals w ON u.id = w.user_id AND w.status IN ('sent', 'processing')
GROUP BY u.id, u.email, u.name;

-- Platform revenue view (withdrawal fees earned)
CREATE VIEW platform_revenue AS
SELECT 
    SUM(fee_zec) as total_fees_earned_zec,
    COUNT(*) as total_withdrawals,
    AVG(fee_zec) as avg_fee_per_withdrawal,
    MIN(fee_zec) as min_fee,
    MAX(fee_zec) as max_fee
FROM withdrawals 
WHERE status IN ('sent', 'processing');

-- Active subscriptions view
CREATE VIEW active_subscriptions AS
SELECT 
    i.user_id,
    u.email,
    i.expires_at,
    i.paid_amount_zec,
    i.created_at
FROM invoices i
JOIN users u ON i.user_id = u.id
WHERE i.type = 'subscription' 
  AND i.status = 'paid' 
  AND (i.expires_at IS NULL OR i.expires_at > NOW());

-- =====================================================
-- 6. API KEYS TABLE (Authentication & Authorization)
-- =====================================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of the API key
    permissions JSONB NOT NULL DEFAULT '["read", "write"]'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for API keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at);

-- Trigger for API keys updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE
    ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================
INSERT INTO users (email, name) VALUES 
('test@example.com', 'Test User'),
('creator@example.com', 'Content Creator');