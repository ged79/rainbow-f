-- Supabase Dashboard에서 admin@flower.com 계정 생성 후 실행
-- 1. admin_users 테이블 정리
DELETE FROM admin_users WHERE email IN ('gttimeedu@gmail.com', 'admin@flower.com', 'support@flower.com');

-- 2. admin@flower.com을 admin_users에 추가
INSERT INTO admin_users (id, email, name, role, permissions)
SELECT 
  id,
  'admin@flower.com',
  'Administrator',
  'super_admin',
  '["all"]'::jsonb
FROM auth.users 
WHERE email = 'admin@flower.com';

-- 3. 확인
SELECT * FROM admin_users WHERE email = 'admin@flower.com';
