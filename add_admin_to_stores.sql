-- admin@flower.com을 stores에 admin으로 추가
INSERT INTO stores (
  user_id,
  store_code,
  business_name,
  owner_name,
  phone,
  email,
  address,
  service_areas,
  points_balance,
  commission_rate,
  status
) VALUES (
  '4247db96-14c9-4939-8275-5ada47474eb3',
  'admin',
  'Admin Dashboard',
  'Administrator',
  '000-0000-0000',
  'admin@flower.com',
  '{}',
  ARRAY[]::text[],
  0,
  0,
  'active'
);

-- 확인
SELECT store_code, business_name, email 
FROM stores 
WHERE user_id = '4247db96-14c9-4939-8275-5ada47474eb3';
