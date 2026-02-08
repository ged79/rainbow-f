-- =============================================
-- PHASE 4: ENABLE RLS WITH SERVICE_ROLE POLICIES
-- VERIFIED: Each policy has unique name per table
-- =============================================

-- Step 1: Create service_role policies (allows SERVICE_ROLE_KEY to bypass RLS)

-- customer_orders
CREATE POLICY "customer_orders_service_role_access" ON customer_orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- coupons
CREATE POLICY "coupons_service_role_access" ON coupons
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- members
CREATE POLICY "members_service_role_access" ON members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- order_reviews
CREATE POLICY "order_reviews_service_role_access" ON order_reviews
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- referrals
CREATE POLICY "referrals_service_role_access" ON referrals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- security_audit_logs (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_audit_logs') THEN
    EXECUTE 'CREATE POLICY "security_audit_logs_service_role_access" ON security_audit_logs
      FOR ALL
      USING (auth.role() = ''service_role'')
      WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

-- Step 2: Products - anon can read active products only
CREATE POLICY "products_anon_read" ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "products_service_role_access" ON products
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 3: Enable RLS (ONLY after policies created)
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verification: Check RLS is enabled and policies exist
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'customer_orders', 'coupons', 'members', 'products',
    'order_reviews', 'referrals'
  )
ORDER BY tablename;

-- Verification: List all policies created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as "Command"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'customer_orders', 'coupons', 'members', 'products',
    'order_reviews', 'referrals'
  )
ORDER BY tablename, policyname;
