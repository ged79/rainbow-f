-- 1. admin_users 테이블 확인
SELECT * FROM admin_users;

-- 2. auth.users에서 현재 이메일로 user_id 찾기
SELECT id, email FROM auth.users WHERE email = 'admin@flower.com';

-- 3. 해당 user_id로 stores에 admin 레코드 추가 (위에서 나온 id 사용)
INSERT INTO stores (
  user_id,
  store_code,
  business_name,
  owner_name,
  phone,
  email,
  status
) VALUES (
  'USER_ID_FROM_STEP_2',  -- 2번에서 나온 id로 교체
  'admin',
  'Admin Dashboard',
  'Administrator',
  '000-0000-0000',
  'admin@flower.com',
  'active'
);
