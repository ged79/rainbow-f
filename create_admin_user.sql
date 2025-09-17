-- 1. Admin 사용자 생성
INSERT INTO admin_users (id, email, name, role, created_at)
VALUES (
  gen_random_uuid(),
  'gttimeedu@gmail.com',
  'Admin',
  'super_admin',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. auth.users에도 등록 (Supabase Auth)
-- 주의: 이 부분은 Supabase Dashboard에서 직접 수행해야 할 수 있음
-- Users 테이블에서 gttimeedu@gmail.com 계정 생성

-- 3. RLS 정책 수정 - Admin 전용
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;
CREATE POLICY "Admin full access to orders" ON orders
FOR ALL 
USING (
  auth.email() = 'gttimeedu@gmail.com' OR
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
);

DROP POLICY IF EXISTS "settlements_policy" ON settlements;
CREATE POLICY "Admin full access to settlements" ON settlements
FOR ALL
USING (
  auth.email() = 'gttimeedu@gmail.com' OR
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.email = auth.email()
  )
);

-- 4. 확인
SELECT * FROM admin_users WHERE email = 'gttimeedu@gmail.com';