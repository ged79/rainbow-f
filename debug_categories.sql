-- =============================================
-- 카테고리별 상품 확인
-- =============================================

-- 1. 전체 활성 상품 확인
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  price,
  image_url
FROM products
WHERE is_active = true
ORDER BY category_1, category_2
LIMIT 20;

-- 2. 카테고리별 상품 수
SELECT 
  category_1,
  category_2,
  COUNT(*) as product_count
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- 3. 카테고리 이름 정확히 확인
SELECT DISTINCT category_1
FROM products
WHERE is_active = true;

-- 4. 개업·행사 카테고리 확인 (예시)
SELECT *
FROM products
WHERE category_1 = '개업·행사' 
  AND is_active = true;
