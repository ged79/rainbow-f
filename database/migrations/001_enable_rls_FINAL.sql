-- =============================================
-- PHASE 4: SECURE RLS MIGRATION
-- Drops insecure policies, creates secure ones
-- =============================================

-- Step 0: Drop ALL existing insecure policies
DROP POLICY IF EXISTS "members_anon_select" ON members;
DROP POLICY IF EXISTS "members_anon_insert" ON members;
DROP POLICY IF EXISTS "coupons_anon_select" ON coupons;
DROP POLICY IF EXISTS "coupons_anon_update" ON coupons;
DROP POLICY IF EXISTS "Allow all operations" ON customer_orders;
DROP POLICY IF EXISTS "Anyone can create customer orders" ON customer_orders;

-- Step 1: Create secure service_role policies

-- customer_orders
CREATE POLICY "customer_orders_service_role" ON customer_orders
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- coupons
CREATE POLICY "coupons_service_role" ON coupons
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- members
CREATE POLICY "members_service_role" ON members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- order_reviews
CREATE POLICY "order_reviews_service_role" ON order_reviews
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- referrals
CREATE POLICY "referrals_service_role" ON referrals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 2: Products - anon read only for active
CREATE POLICY "products_anon_read" ON products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "products_service_role" ON products
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Step 3: Enable RLS on all tables
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Verification
SELECT 
  tablename,
  rowsecurity as "RLS"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('customer_orders', 'coupons', 'members', 'products')
ORDER BY tablename;

SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
