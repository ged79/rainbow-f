-- =============================================
-- Flower Delivery Platform Database Schema
-- Multi-tenant B2B with RLS
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Drop existing types if they exist
-- =============================================
DROP TYPE IF EXISTS store_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS point_transaction_type CASCADE;
DROP TYPE IF EXISTS settlement_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE store_status AS ENUM ('pending', 'active', 'suspended', 'closed');
CREATE TYPE order_status AS ENUM ('pending', 'accepted', 'preparing', 'delivering', 'completed', 'cancelled', 'rejected');
CREATE TYPE order_type AS ENUM ('send', 'receive');
CREATE TYPE point_transaction_type AS ENUM ('charge', 'payment', 'income', 'commission', 'refund', 'withdrawal');
CREATE TYPE settlement_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE notification_type AS ENUM ('order', 'payment', 'settlement', 'system');
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- =============================================
-- STORES TABLE
-- =============================================

CREATE TABLE stores (
    -- Identifiers
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Basic Info
    business_name VARCHAR(100) NOT NULL,
    owner_name VARCHAR(50) NOT NULL,
    business_license VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Address
    address JSONB NOT NULL DEFAULT '{}',
    -- {sido, sigungu, dong, detail, postal_code}
    
    -- Service Areas
    service_areas TEXT[] DEFAULT '{}',
    
    -- Financial
    points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
    commission_rate DECIMAL(3,2) NOT NULL DEFAULT 0.10 CHECK (commission_rate >= 0 AND commission_rate <= 1),
    
    -- Banking
    bank_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(50) NOT NULL,
    
    -- Operations
    status store_status NOT NULL DEFAULT 'pending',
    is_open BOOLEAN NOT NULL DEFAULT true,
    business_hours JSONB DEFAULT '{"weekday": {"open": "09:00", "close": "18:00"}, "weekend": {"open": "09:00", "close": "15:00"}}',
    
    -- Statistics
    rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_orders_sent INTEGER DEFAULT 0,
    total_orders_received INTEGER DEFAULT 0,
    total_sales BIGINT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_service_areas ON stores USING GIN(service_areas);
CREATE INDEX idx_stores_address ON stores USING GIN(address);

-- =============================================
-- ORDERS TABLE
-- =============================================

CREATE TABLE orders (
    -- Identifiers
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE,
    
    -- Multi-tenant Keys
    sender_store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    receiver_store_id UUID REFERENCES stores(id) ON DELETE RESTRICT,
    
    -- Order Type
    type order_type NOT NULL DEFAULT 'send',
    
    -- Customer Info
    customer JSONB NOT NULL DEFAULT '{}',
    -- {name, phone, memo}
    
    -- Recipient Info
    recipient JSONB NOT NULL DEFAULT '{}',
    -- {name, phone, address: {sido, sigungu, dong, detail, postal_code}, delivery_date, delivery_time}
    
    -- Product Info
    product JSONB NOT NULL DEFAULT '{}',
    -- {type, name, price, quantity, ribbon_text[], special_instructions}
    
    -- Financial
    payment JSONB NOT NULL DEFAULT '{}',
    -- {subtotal, commission, total, points_used}
    
    -- Status
    status order_status NOT NULL DEFAULT 'pending',
    status_history JSONB[] DEFAULT '{}',
    
    -- Timer
    pending_until TIMESTAMPTZ,
    
    -- Completion
    completion JSONB,
    -- {photos[], recipient_name, completed_at, note}
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_sender_store ON orders(sender_store_id);
CREATE INDEX idx_orders_receiver_store ON orders(receiver_store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_pending_until ON orders(pending_until) WHERE status = 'pending';

-- =============================================
-- SETTLEMENTS TABLE (Create before point_transactions)
-- =============================================

CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Summary
    summary JSONB NOT NULL DEFAULT '{}',
    -- {total_orders, total_sales, total_commission, net_amount}
    
    order_ids UUID[] DEFAULT '{}',
    
    status settlement_status NOT NULL DEFAULT 'pending',
    
    -- Withdrawal
    withdrawal JSONB,
    -- {requested_at, processed_at, bank_name, account_number, account_holder, transaction_id}
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_settlements_store ON settlements(store_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);

-- =============================================
-- POINT TRANSACTIONS TABLE
-- =============================================

CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
    
    type point_transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    
    -- Related entities
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    settlement_id UUID REFERENCES settlements(id) ON DELETE SET NULL,
    
    description TEXT NOT NULL,
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_point_transactions_store ON point_transactions(store_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_order ON point_transactions(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_point_transactions_settlement ON point_transactions(settlement_id) WHERE settlement_id IS NOT NULL;

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entities
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    settlement_id UUID REFERENCES settlements(id) ON DELETE CASCADE,
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    
    priority notification_priority DEFAULT 'medium',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_store ON notifications(store_id);
CREATE INDEX idx_notifications_read ON notifications(store_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate order number
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Auto-reject pending orders after 30 minutes
CREATE OR REPLACE FUNCTION auto_reject_pending_orders()
RETURNS void AS $$
BEGIN
    UPDATE orders
    SET status = 'rejected',
        status_history = array_append(
            status_history, 
            jsonb_build_object(
                'status', 'rejected',
                'timestamp', NOW(),
                'note', 'Auto-rejected after 30 minutes'
            )
        )
    WHERE status = 'pending' 
    AND pending_until IS NOT NULL 
    AND pending_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Users can insert their own store during registration" ON stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own store" ON stores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own store" ON stores
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public can view active stores for ordering" ON stores
    FOR SELECT USING (status = 'active' AND is_open = true);

-- Orders policies
CREATE POLICY "Stores can view their orders" ON orders
    FOR SELECT USING (
        sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        receiver_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Stores can create orders" ON orders
    FOR INSERT WITH CHECK (
        sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Stores can update their orders" ON orders
    FOR UPDATE USING (
        sender_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()) OR
        receiver_store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- Point transactions policies
CREATE POLICY "Stores can view their transactions" ON point_transactions
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert transactions" ON point_transactions
    FOR INSERT WITH CHECK (true); -- Functions handle validation

-- Settlements policies
CREATE POLICY "Stores can view their settlements" ON settlements
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Stores can update their settlements" ON settlements
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

-- Notifications policies
CREATE POLICY "Stores can view their notifications" ON notifications
    FOR SELECT USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "Stores can update their notifications" ON notifications
    FOR UPDATE USING (
        store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    );

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- System generates notifications

-- =============================================
-- FUNCTIONS
-- =============================================

-- Deduct points for order
CREATE OR REPLACE FUNCTION deduct_points(
    p_store_id UUID,
    p_amount INTEGER,
    p_order_id UUID
)
RETURNS void AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- Get current balance with lock
    SELECT points_balance INTO v_balance
    FROM stores
    WHERE id = p_store_id
    FOR UPDATE;
    
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient points balance';
    END IF;
    
    -- Update balance
    UPDATE stores
    SET points_balance = points_balance - p_amount,
        total_orders_sent = total_orders_sent + 1
    WHERE id = p_store_id;
    
    -- Record transaction
    INSERT INTO point_transactions (
        store_id, type, amount, 
        balance_before, balance_after,
        order_id, description
    ) VALUES (
        p_store_id, 'payment', -p_amount,
        v_balance, v_balance - p_amount,
        p_order_id, 'Order payment'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add points for completed order
CREATE OR REPLACE FUNCTION add_points(
    p_store_id UUID,
    p_amount INTEGER,
    p_order_id UUID
)
RETURNS void AS $$
DECLARE
    v_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT points_balance INTO v_balance
    FROM stores
    WHERE id = p_store_id
    FOR UPDATE;
    
    -- Update balance
    UPDATE stores
    SET points_balance = points_balance + p_amount,
        total_sales = total_sales + p_amount,
        total_orders_received = total_orders_received + 1
    WHERE id = p_store_id;
    
    -- Record transaction
    INSERT INTO point_transactions (
        store_id, type, amount, 
        balance_before, balance_after,
        order_id, description
    ) VALUES (
        p_store_id, 'income', p_amount,
        v_balance, v_balance + p_amount,
        p_order_id, 'Order income'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Charge points
CREATE OR REPLACE FUNCTION charge_points(
    p_store_id UUID,
    p_amount INTEGER
)
RETURNS point_transactions AS $$
DECLARE
    v_balance INTEGER;
    v_transaction point_transactions;
BEGIN
    IF p_amount < 100000 THEN
        RAISE EXCEPTION 'Minimum charge amount is 100,000 KRW';
    END IF;
    
    -- Get current balance
    SELECT points_balance INTO v_balance
    FROM stores
    WHERE id = p_store_id
    FOR UPDATE;
    
    -- Update balance
    UPDATE stores
    SET points_balance = points_balance + p_amount
    WHERE id = p_store_id;
    
    -- Record transaction
    INSERT INTO point_transactions (
        store_id, type, amount, 
        balance_before, balance_after,
        description
    ) VALUES (
        p_store_id, 'charge', p_amount,
        v_balance, v_balance + p_amount,
        'Point charge'
    ) RETURNING * INTO v_transaction;
    
    RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
