-- 안전한 방법: Admin 사용자 확인 및 권한 부여

-- 1. 현재 로그인한 사용자 ID 확인
SELECT auth.uid() as current_user_id;

-- 2. stores 테이블에 admin 레코드가 있는지 확인
SELECT * FROM stores WHERE user_id = auth.uid();

-- 3. admin 레코드 추가 (위에서 나온 user_id 사용)
INSERT INTO stores (
  user_id,
  store_code,
  business_name,
  owner_name,
  business_license,
  phone,
  email,
  address,
  service_areas,
  points_balance,
  commission_rate,
  bank_name,
  account_number,
  account_holder,
  status,
  is_open
) VALUES (
  auth.uid(),  -- 현재 로그인한 사용자
  'admin',
  'Admin Dashboard',
  'Administrator',
  'ADMIN-001',
  '000-0000-0000',
  'admin@example.com',
  '{}',  -- JSONB
  ARRAY[]::text[],
  0,
  0,
  '',
  '',
  '',
  'active',
  true
);

-- 4. 확인
SELECT store_code, business_name 
FROM stores 
WHERE user_id = auth.uid();
