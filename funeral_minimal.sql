-- =============================================
-- 테이블 구조 확인 후 작업
-- =============================================

-- STEP 1: 정확한 컬럼 확인
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products';

-- STEP 2: 실제 데이터 확인
SELECT * FROM products WHERE category_1 = '장례식' LIMIT 1;

-- STEP 3: 120송이 근조화환 추가 (최소 필드만)
DELETE FROM products WHERE display_name = '120송이 근조화환';

INSERT INTO products (
  base_name,
  display_name,
  category_1,
  category_2,
  price,
  customer_price,
  florist_price,
  description,
  image_url,
  is_active,
  sort_order
) VALUES (
  '120송이 근조화환',
  '120송이 근조화환',
  '장례식',
  '근조화환',
  155000,
  155000,
  110000,
  '깊은 애도를 전하는 프리미엄 120송이 근조화환',
  '/images/funeral_wreath_120.jpg',
  true,
  1
);

-- STEP 4: 영정바구니 추가
DELETE FROM products WHERE display_name = '영정바구니';

INSERT INTO products (
  base_name,
  display_name,
  category_1,
  category_2,
  price,
  customer_price,
  florist_price,
  description,
  image_url,
  is_active,
  sort_order
) VALUES (
  '영정바구니',
  '영정바구니',
  '장례식',
  '근조꽃바구니',
  60000,
  60000,
  40000,
  '고인을 추모하는 영정 앞 헌화용 바구니',
  '/images/funeral_basket.jpg',
  true,
  10
);