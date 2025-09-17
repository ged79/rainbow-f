-- RLS 정책 생성 (Service Role Key 제거 전 필수)
-- 실행 전 백업 권장

-- 1. members 테이블 - 로그인/회원가입
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_anon_select" ON members
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "members_anon_insert" ON members
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. customer_orders 테이블 - 주문조회
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_orders_anon_select" ON customer_orders
  FOR SELECT
  TO anon
  USING (true);

-- 3. coupons 테이블 - 쿠폰조회
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_anon_select" ON coupons
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "coupons_anon_update" ON coupons
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 4. sessions 테이블 - 세션관리
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_anon_all" ON sessions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 확인 쿼리
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'customer_orders', 'coupons', 'sessions')
ORDER BY tablename, policyname;
