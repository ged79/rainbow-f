-- 1. admin_users 테이블 구조 확인
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'admin_users';

-- 2. admin_users 테이블 정리
DELETE FROM admin_users WHERE email IN ('gttimeedu@gmail.com', 'admin@flower.com', 'support@flower.com');

-- 3. admin@flower.com을 admin_users에 추가 (name 컬럼 제외)
INSERT INTO admin_users (id, email, role, permissions)
SELECT 
  id,
  'admin@flower.com',
  'super_admin',
  '["all"]'::jsonb
FROM auth.users 
WHERE email = 'admin@flower.com';

-- 4. 확인
SELECT * FROM admin_users WHERE email = 'admin@flower.com';
