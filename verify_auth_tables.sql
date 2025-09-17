-- Check if members table exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        CREATE TABLE members (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            phone VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(50) NOT NULL,
            email VARCHAR(100),
            total_points INTEGER DEFAULT 0,
            total_purchases INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            last_login TIMESTAMP
        );
        
        CREATE INDEX idx_members_phone ON members(phone);
        
        RAISE NOTICE 'Members table created successfully';
    ELSE
        RAISE NOTICE 'Members table already exists';
    END IF;
END $$;

-- Check if member_sessions table exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_sessions') THEN
        CREATE TABLE member_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            member_id UUID REFERENCES members(id) ON DELETE CASCADE,
            token VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_sessions_token ON member_sessions(token);
        CREATE INDEX idx_sessions_member ON member_sessions(member_id);
        
        RAISE NOTICE 'Member_sessions table created successfully';
    ELSE
        RAISE NOTICE 'Member_sessions table already exists';
    END IF;
END $$;

-- Check if coupons table exists and create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') THEN
        CREATE TABLE coupons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code VARCHAR(50) UNIQUE NOT NULL,
            customer_phone VARCHAR(20),
            amount DECIMAL(10,2) NOT NULL,
            type VARCHAR(50),
            expires_at TIMESTAMP,
            used_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_coupons_code ON coupons(code);
        CREATE INDEX idx_coupons_phone ON coupons(customer_phone);
        
        RAISE NOTICE 'Coupons table created successfully';
    ELSE
        RAISE NOTICE 'Coupons table already exists';
    END IF;
END $$;

-- Disable RLS for development (TEMPORARY - DO NOT USE IN PRODUCTION)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE member_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- Check tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('members', 'member_sessions', 'coupons')
ORDER BY table_name;
