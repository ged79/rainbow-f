-- 모든 NOT NULL 필드 포함
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
  status
) VALUES (
  '4247db96-14c9-4939-8275-5ada47474eb3',
  'admin',
  'Admin Dashboard',
  'Administrator',
  'ADMIN-001',
  '000-0000-0000',
  'admin@flower.com',
  '{}',
  ARRAY[]::text[],
  0,
  0,
  'N/A',
  'N/A',
  'Admin',
  'active'
);
