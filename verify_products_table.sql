-- =============================================
-- products 테이블 구조 확인
-- =============================================

-- 1. 테이블 컬럼 목록 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 2. 활성 상품 수 확인
SELECT 
  category_1,
  category_2,
  COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- 3. 샘플 데이터 확인
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  price,
  image_url,
  is_active
FROM products
WHERE is_active = true
LIMIT 10;
