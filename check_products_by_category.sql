-- =============================================
-- 카테고리별 상품 확인 및 테스트
-- =============================================

-- 1. 활성 상품 카테고리별 카운트
SELECT 
  category_1,
  category_2,
  COUNT(*) as product_count
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- 2. 카테고리가 없거나 잘못된 상품 확인
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  is_active
FROM products
WHERE (category_1 IS NULL OR category_2 IS NULL)
  AND is_active = true;

-- 3. 각 카테고리별 샘플 상품 확인
-- 개업·행사
SELECT display_name, price, image_url, images
FROM products
WHERE category_1 = '개업·행사' AND is_active = true
LIMIT 3;

-- 결혼식
SELECT display_name, price, image_url, images
FROM products
WHERE category_1 = '결혼식' AND is_active = true
LIMIT 3;

-- 장례식
SELECT display_name, price, image_url, images
FROM products
WHERE category_1 = '장례식' AND is_active = true
LIMIT 3;

-- 승진·기념일
SELECT display_name, price, image_url, images
FROM products
WHERE category_1 = '승진·기념일' AND is_active = true
LIMIT 3;

-- 4. 이미지가 없는 상품 확인
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  image_url,
  images
FROM products
WHERE is_active = true
  AND (image_url IS NULL OR image_url = '')
  AND (images IS NULL OR images = '{}');

-- 5. 전체 활성 상품 수
SELECT COUNT(*) as total_active_products
FROM products
WHERE is_active = true;
