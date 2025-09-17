-- 기존 정책 확인
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'customer_orders', 'coupons', 'sessions');

-- RLS 활성화 상태 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'customer_orders', 'coupons', 'sessions');

-- 중복 방지하며 생성
DO $$ 
BEGIN
  -- members 정책
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'members_anon_select') THEN
    CREATE POLICY "members_anon_select" ON members FOR SELECT TO anon USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'members_anon_insert') THEN
    CREATE POLICY "members_anon_insert" ON members FOR INSERT TO anon WITH CHECK (true);
  END IF;
  
  -- customer_orders 정책
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_orders' AND policyname = 'customer_orders_anon_select') THEN
    CREATE POLICY "customer_orders_anon_select" ON customer_orders FOR SELECT TO anon USING (true);
  END IF;
  
  -- coupons 정책
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_anon_select') THEN
    CREATE POLICY "coupons_anon_select" ON coupons FOR SELECT TO anon USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'coupons_anon_update') THEN
    CREATE POLICY "coupons_anon_update" ON coupons FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
  
  -- sessions 정책
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'sessions_anon_all') THEN
    CREATE POLICY "sessions_anon_all" ON sessions FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;