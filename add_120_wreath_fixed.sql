-- =============================================
-- 장례식 상품 재구성 - 에러 수정 버전
-- base_name 필드 추가
-- =============================================

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 1: 테이블 구조 확인
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- 먼저 기존 상품의 필드 확인
SELECT 
  base_name,
  display_name,
  product_id,
  area_code,
  area_name
FROM products 
WHERE category_1 = '장례식' 
  AND is_active = true
LIMIT 1;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 2: 120송이 근조화환 추가 (수정 버전)
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- 먼저 중복 체크
DELETE FROM products WHERE display_name = '120송이 근조화환';

-- 100송이 화환의 데이터를 참조하여 추가
INSERT INTO products (
  base_name,
  display_name,
  product_id,
  area_code,
  area_name,
  category_1, 
  category_2,
  customer_price,
  florist_price,
  price,
  description,
  image_url,
  is_active,
  sort_order,
  created_at,
  updated_at
)
SELECT 
  '120송이 근조화환' as base_name,  -- base_name 추가
  '120송이 근조화환' as display_name,
  product_id,  -- 동일한 product_id 사용
  area_code,   -- 동일한 area_code 사용
  area_name,   -- 동일한 area_name 사용
  '장례식' as category_1,
  '근조화환' as category_2,
  155000 as customer_price,
  110000 as florist_price,
  155000 as price,
  '깊은 애도를 전하는 프리미엄 120송이 근조화환' as description,
  image_url,  -- 100송이와 같은 이미지 사용 (임시)
  true as is_active,
  1 as sort_order,
  NOW() as created_at,
  NOW() as updated_at
FROM products 
WHERE display_name = '100송이 근조화환'
  AND is_active = true
LIMIT 1;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 3: 영정바구니 추가 (수정 버전)
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- 먼저 중복 체크
DELETE FROM products WHERE display_name = '영정바구니';

-- 근조꽃바구니의 데이터를 참조하여 추가
INSERT INTO products (
  base_name,
  display_name,
  product_id,
  area_code,
  area_name,
  category_1,
  category_2,
  customer_price,
  florist_price,
  price,
  description,
  image_url,
  is_active,
  sort_order,
  created_at,
  updated_at
)
SELECT 
  '영정바구니' as base_name,
  '영정바구니' as display_name,
  product_id,
  area_code,
  area_name,
  '장례식' as category_1,
  '근조꽃바구니' as category_2,
  60000 as customer_price,
  40000 as florist_price,
  60000 as price,
  '고인을 추모하는 영정 앞 헌화용 바구니' as description,
  image_url,  -- 근조꽃바구니와 같은 이미지 사용 (임시)
  true as is_active,
  10 as sort_order,
  NOW() as created_at,
  NOW() as updated_at
FROM products 
WHERE display_name = '근조꽃바구니'
  AND category_1 = '장례식'
LIMIT 1;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 4: 확인
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
SELECT 
  base_name,
  display_name,
  category_2,
  customer_price
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true
ORDER BY customer_price DESC;