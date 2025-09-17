-- customer_orders 테이블 RLS 완전 비활성화
ALTER TABLE customer_orders DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자에게 전체 권한 부여
DROP POLICY IF EXISTS "Anyone can create customer orders" ON customer_orders;
DROP POLICY IF EXISTS "Admin can manage customer orders" ON customer_orders;
DROP POLICY IF EXISTS "Admin can view all customer orders" ON customer_orders;

-- RLS 활성화 상태에서 모든 작업 허용
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON customer_orders
  FOR ALL USING (true) WITH CHECK (true);