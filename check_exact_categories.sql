-- =============================================
-- 실제 DB 카테고리 확인
-- =============================================

-- 1. 현재 DB에 있는 정확한 카테고리명 확인
SELECT DISTINCT 
  category_1,
  COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY category_1
ORDER BY category_1;

-- 2. 각 카테고리별 세부 확인
SELECT 
  category_1,
  category_2,
  COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- 3. 카테고리명에 특수문자 확인
SELECT DISTINCT 
  category_1,
  LENGTH(category_1) as length,
  ENCODE(category_1::bytea, 'hex') as hex
FROM products
WHERE is_active = true;
