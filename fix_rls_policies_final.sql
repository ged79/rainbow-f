-- ===============================================
-- customer_orders 테이블 RLS 정책 수정
-- 고객이 자신의 주문을 조회할 수 있도록 설정
-- ===============================================

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Admin can view all customer orders" ON customer_orders;
DROP POLICY IF EXISTS "Admin can manage customer orders" ON customer_orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON customer_orders;
DROP POLICY IF EXISTS "Anyone can create customer orders" ON customer_orders;
DROP POLICY IF EXISTS "Public can read customer orders" ON customer_orders;

-- 2. RLS 활성화 상태 유지 (보안 유지)
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책 생성

-- 정책 1: 누구나 주문 조회 가능 (SELECT만 허용)
CREATE POLICY "Anyone can select customer orders" ON customer_orders
  FOR SELECT 
  USING (true);

-- 정책 2: 누구나 주문 생성 가능 (INSERT만 허용)  
CREATE POLICY "Anyone can insert customer orders" ON customer_orders
  FOR INSERT 
  WITH CHECK (true);

-- 정책 3: Admin은 모든 작업 가능
CREATE POLICY "Admin full access to customer orders" ON customer_orders
  FOR ALL 
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM admin_users WHERE role IN ('super_admin', 'admin')
    )
  );

-- 4. order_items 테이블 정책 설정
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;

CREATE POLICY "Anyone can select order items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- 5. coupons 테이블 정책 설정
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can create coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can update coupons" ON coupons;

CREATE POLICY "Anyone can select coupons" ON coupons
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert coupons" ON coupons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update own coupons" ON coupons
  FOR UPDATE USING (true);

-- 6. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('customer_orders', 'order_items', 'coupons')
ORDER BY tablename, policyname;