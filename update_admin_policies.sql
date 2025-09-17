-- 1. 기존 admin 사용자 확인 및 업데이트
UPDATE admin_users 
SET role = 'super_admin'
WHERE email = 'gttimeedu@gmail.com';

-- 2. RLS 정책 수정
DROP POLICY IF EXISTS "Admin full access to orders" ON orders;
CREATE POLICY "Admin full access to orders" ON orders
FOR ALL 
USING (
  auth.email() IN (
    SELECT email FROM admin_users
  )
);

DROP POLICY IF EXISTS "Admin full access to settlements" ON settlements;
CREATE POLICY "Admin full access to settlements" ON settlements
FOR ALL
USING (
  auth.email() IN (
    SELECT email FROM admin_users
  )
);

-- 3. 확인
SELECT * FROM admin_users WHERE email = 'gttimeedu@gmail.com';
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('orders', 'settlements');