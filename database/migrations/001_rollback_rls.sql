-- ROLLBACK SCRIPT - IF PHASE 4 BREAKS ANYTHING
-- Run this to immediately restore previous state

-- Disable RLS on all tables
ALTER TABLE customer_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Drop policies (optional, disabling RLS is enough)
DROP POLICY IF EXISTS "service_role_full_access" ON customer_orders;
DROP POLICY IF EXISTS "service_role_full_access" ON coupons;
DROP POLICY IF EXISTS "service_role_full_access" ON members;
DROP POLICY IF EXISTS "service_role_full_access" ON order_reviews;
DROP POLICY IF EXISTS "service_role_full_access" ON referrals;
DROP POLICY IF EXISTS "service_role_full_access" ON user_sessions;
DROP POLICY IF EXISTS "service_role_full_access" ON security_audit_logs;
DROP POLICY IF EXISTS "anon_read_active_products" ON products;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as "RLS Enabled (should be false)"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'customer_orders', 'coupons', 'members', 'products'
  );
