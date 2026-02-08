-- Admin 계정만 설정 (다른 사용자는 유지)
-- 1. admin_users 테이블에서 admin 계정만 삭제
DELETE FROM admin_users WHERE email IN ('gttimeedu@gmail.com', 'admin@system.local', 'admin@flower.com', 'support@flower.com');

-- 2. auth.users에서 admin 계정만 삭제 (stores에 연결되지 않은 계정만)
DELETE FROM auth.users 
WHERE email IN ('gttimeedu@gmail.com', 'admin@flower.com', 'support@flower.com')
AND id NOT IN (SELECT user_id FROM stores);

-- 3. admin@flower.com 계정 생성
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  'admin@flower.com',
  crypt('2222', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Admin"}'::jsonb,
  'authenticated',
  'authenticated'
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('2222', gen_salt('bf')),
  updated_at = NOW();

-- 4. admin_users 테이블에 추가
DO $$ 
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@flower.com';
  
  INSERT INTO admin_users (id, email, name, role, permissions, created_at)
  VALUES (
    admin_user_id,
    'admin@flower.com',
    'Administrator',
    'super_admin',
    '["all"]'::jsonb,
    NOW()
  ) ON CONFLICT (email) DO UPDATE SET
    id = admin_user_id,
    role = 'super_admin',
    permissions = '["all"]'::jsonb,
    updated_at = NOW();
END $$;

-- 5. 확인
SELECT 'Admin Setup Complete' as status;
SELECT * FROM admin_users WHERE email = 'admin@flower.com';
