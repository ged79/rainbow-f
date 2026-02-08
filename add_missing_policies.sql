-- members, coupons, sessions 테이블 정책 추가

-- 1. members 테이블
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_anon_select" ON members FOR SELECT TO anon USING (true);
CREATE POLICY "members_anon_insert" ON members FOR INSERT TO anon WITH CHECK (true);

-- 2. coupons 테이블  
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_anon_select" ON coupons FOR SELECT TO anon USING (true);
CREATE POLICY "coupons_anon_update" ON coupons FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 3. sessions 테이블
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_anon_all" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);

-- 확인
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('members', 'customer_orders', 'coupons', 'sessions')
GROUP BY tablename;