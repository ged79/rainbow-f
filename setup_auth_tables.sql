-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (BE CAREFUL - this will delete all data)
-- Comment these lines out if you want to preserve existing data
-- DROP TABLE IF EXISTS member_sessions CASCADE;
-- DROP TABLE IF EXISTS coupons CASCADE;
-- DROP TABLE IF EXISTS members CASCADE;

-- Create members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    total_points INTEGER DEFAULT 0,
    total_purchases INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create member_sessions table
CREATE TABLE IF NOT EXISTS member_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    customer_phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON member_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_member ON member_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_phone ON coupons(customer_phone);

-- Disable RLS for development (REMOVE IN PRODUCTION!)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and anon roles
GRANT ALL ON members TO authenticated, anon;
GRANT ALL ON member_sessions TO authenticated, anon;
GRANT ALL ON coupons TO authenticated, anon;

-- Test the tables
DO $$
BEGIN
    RAISE NOTICE 'Testing tables...';
    
    -- Check members table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        RAISE NOTICE '✅ members table exists';
    ELSE
        RAISE NOTICE '❌ members table does NOT exist';
    END IF;
    
    -- Check member_sessions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_sessions') THEN
        RAISE NOTICE '✅ member_sessions table exists';
    ELSE
        RAISE NOTICE '❌ member_sessions table does NOT exist';
    END IF;
    
    -- Check coupons table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') THEN
        RAISE NOTICE '✅ coupons table exists';
    ELSE
        RAISE NOTICE '❌ coupons table does NOT exist';
    END IF;
END $$;

-- Show table structures
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name IN ('members', 'member_sessions', 'coupons')
ORDER BY 
    table_name, ordinal_position;