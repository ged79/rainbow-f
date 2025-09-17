-- members, coupons 테이블 정책만 추가 (sessions 제외)

-- 1. members 테이블
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_anon_select" ON members FOR SELECT TO anon USING (true);
CREATE POLICY "members_anon_insert" ON members FOR INSERT TO anon WITH CHECK (true);

-- 2. coupons 테이블  
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_anon_select" ON coupons FOR SELECT TO anon USING (true);
CREATE POLICY "coupons_anon_update" ON coupons FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 확인
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('members', 'customer_orders', 'coupons')
GROUP BY tablename;