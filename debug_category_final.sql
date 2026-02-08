-- =============================================
-- 카테고리 문제 해결을 위한 종합 확인
-- =============================================

-- 1. 정확한 카테고리명과 상품 수 확인
SELECT 
  category_1,
  COUNT(*) as total_products
FROM products
WHERE is_active = true
GROUP BY category_1
ORDER BY category_1;

-- 2. 개업·행사 카테고리 테스트
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  price,
  image_url
FROM products
WHERE category_1 = '개업·행사'
  AND is_active = true
LIMIT 5;

-- 3. 혹시 카테고리명에 공백이나 특수문자 문제 확인
SELECT DISTINCT
  category_1,
  LENGTH(category_1) as len,
  category_1 = '개업·행사' as is_opening,
  category_1 = '결혼식' as is_wedding,
  category_1 = '장례식' as is_funeral,
  category_1 = '승진·기념일' as is_celebration
FROM products
WHERE is_active = true;

-- 4. LIKE 검색으로 확인
SELECT 
  category_1,
  COUNT(*) as count
FROM products
WHERE is_active = true
  AND (
    category_1 LIKE '%개업%' OR
    category_1 LIKE '%결혼%' OR
    category_1 LIKE '%장례%' OR
    category_1 LIKE '%승진%'
  )
GROUP BY category_1;
