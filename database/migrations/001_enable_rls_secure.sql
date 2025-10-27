-- =============================================
-- PHASE 4: ENABLE RLS WITH SERVICE_ROLE POLICIES
-- CRITICAL: Apply policies BEFORE enabling RLS
-- =============================================

-- Step 1: Create service_role policies (allows SERVICE_ROLE_KEY to bypass RLS)

-- customer_orders: Full access for service_role
CREATE POLICY "service_role_full_access" ON customer_orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- coupons: Full access for service_role
CREATE POLICY "service_role_full_access" ON coupons
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- members: Full access for service_role
CREATE POLICY "service_role_full_access" ON members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- order_reviews: Full access for service_role
CREATE POLICY "service_role_full_access" ON order_reviews
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- referrals: Full access for service_role
CREATE POLICY "service_role_full_access" ON referrals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- security_audit_logs: Full access for service_role (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'security_audit_logs') THEN
    EXECUTE 'CREATE POLICY "service_role_full_access" ON security_audit_logs
      FOR ALL
      USING (auth.role() = ''service_role'')
      WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

-- Step 2: Public read-only policies for products (anon can read active products)
CREATE POLICY "anon_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);

-- Step 3: Enable RLS (ONLY after policies created)
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verification query
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'customer_orders', 'coupons', 'members', 'products',
    'order_reviews', 'referrals'
  )
ORDER BY tablename;
