-- =============================================
-- 화환 전문몰 전환 - 안전한 작업 스크립트
-- 작성일: 2024.01.10
-- 주의: 각 단계별로 확인 후 진행하세요
-- =============================================

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 1: 백업 (필수! 먼저 실행)
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
CREATE TABLE IF NOT EXISTS products_backup_20240110 AS 
SELECT * FROM products;

-- 백업 확인
SELECT COUNT(*) as backup_count FROM products_backup_20240110;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 2: 현재 상태 확인
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
SELECT 
  category_1,
  category_2,
  COUNT(*) as count,
  MIN(customer_price) as min_price,
  MAX(customer_price) as max_price
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 3: 화환이 아닌 상품 비활성화 (안전)
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

-- 3-1. 비활성화 대상 확인 (먼저 확인!)
SELECT 
  category_2,
  COUNT(*) as count,
  STRING_AGG(display_name, ', ' ORDER BY display_name) as products
FROM products
WHERE is_active = true
  AND category_2 IN ('개업화분', '공기정화식물', '꽃다발', '꽃바구니', 
                     '탁상용화분', '특별한선물', '호접란', '근조꽃바구니', '근조장구')
GROUP BY category_2;

-- 3-2. 화환이 아닌 상품 비활성화 실행
UPDATE products 
SET 
  is_active = false,
  updated_at = NOW()
WHERE is_active = true
  AND category_2 IN ('개업화분', '공기정화식물', '꽃다발', '꽃바구니', 
                     '탁상용화분', '특별한선물', '호접란', '근조꽃바구니', '근조장구');

-- 3-3. 결과 확인
SELECT 
  CASE 
    WHEN is_active = true THEN '활성'
    ELSE '비활성'
  END as status,
  COUNT(*) as count
FROM products
GROUP BY is_active;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 4: 기존 화환 가격 조정 (선택적)
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

-- 4-1. 현재 화환 가격 확인
SELECT 
  id,
  display_name,
  category_1,
  category_2,
  customer_price,
  florist_price
FROM products
WHERE is_active = true
  AND category_2 IN ('축하화환', '근조화환')
ORDER BY category_1, display_name;

-- 4-2. 가격 조정 (100송이 → 15만원, 80송이 → 12만원, 60송이 → 10만원)
-- 주의: 실행 전 가격 확인!
UPDATE products
SET 
  customer_price = CASE 
    WHEN display_name LIKE '100송이%' THEN 150000
    WHEN display_name LIKE '80송이%' THEN 120000
    WHEN display_name LIKE '60송이%' THEN 100000
    WHEN display_name LIKE '실속%' THEN 80000
    ELSE customer_price
  END,
  florist_price = CASE 
    WHEN display_name LIKE '100송이%' THEN 100000
    WHEN display_name LIKE '80송이%' THEN 80000
    WHEN display_name LIKE '60송이%' THEN 70000
    WHEN display_name LIKE '실속%' THEN 55000
    ELSE florist_price
  END,
  updated_at = NOW()
WHERE is_active = true
  AND category_2 IN ('축하화환', '근조화환');

-- 4-3. 가격 조정 결과 확인
SELECT 
  display_name,
  category_1,
  customer_price,
  florist_price,
  (customer_price - florist_price) as margin
FROM products
WHERE is_active = true
  AND category_2 IN ('축하화환', '근조화환')
ORDER BY customer_price DESC;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- STEP 5: 최종 확인
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- 활성 상품 요약
SELECT 
  category_1,
  category_2,
  COUNT(*) as count,
  MIN(customer_price) as min_price,
  MAX(customer_price) as max_price,
  AVG(customer_price)::INTEGER as avg_price
FROM products
WHERE is_active = true
GROUP BY category_1, category_2
ORDER BY category_1, category_2;

-- 전체 활성 상품 수
SELECT COUNT(*) as total_active_products
FROM products
WHERE is_active = true;

-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- ROLLBACK (문제 발생 시)
-- ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
-- 원복이 필요한 경우:
/*
-- 백업에서 복원
TRUNCATE TABLE products;
INSERT INTO products SELECT * FROM products_backup_20240110;

-- 또는 특정 상품만 다시 활성화
UPDATE products 
SET is_active = true 
WHERE category_2 IN ('꽃다발', '꽃바구니');
*/
