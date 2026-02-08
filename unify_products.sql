-- Products 테이블 통합 정리
-- Homepage 기준 상품명과 가격으로 통일

-- 1. 기존 데이터 백업
CREATE TABLE IF NOT EXISTS products_backup AS SELECT * FROM products;

-- 2. 화환 상품 통일 (홈페이지 기준)
UPDATE products SET
  display_name = CASE
    -- 근조화환
    WHEN display_name LIKE '%근조%실속%' THEN '실속 근조화환'
    WHEN display_name LIKE '%근조%40%' THEN '실속 근조화환'
    WHEN display_name LIKE '%근조%60%' THEN '60송이 근조화환'
    WHEN display_name LIKE '%근조%80%' THEN '80송이 근조화환'
    WHEN display_name LIKE '%근조%100%' THEN '100송이 근조화환'
    WHEN display_name LIKE '%근조%120%' THEN '120송이 근조화환'
    -- 축하화환
    WHEN display_name LIKE '%축하%실속%' THEN '실속 축하화환'
    WHEN display_name LIKE '%축하%40%' THEN '실속 축하화환'
    WHEN display_name LIKE '%축하%60%' THEN '60송이 축하화환'
    WHEN display_name LIKE '%축하%80%' THEN '80송이 축하화환'
    WHEN display_name LIKE '%축하%100%' THEN '100송이 축하화환'
    ELSE display_name
  END,
  customer_price = CASE
    -- 근조화환 홈페이지 가격
    WHEN display_name LIKE '%근조%실속%' THEN 55000
    WHEN display_name LIKE '%근조%60%' THEN 67000
    WHEN display_name LIKE '%근조%80%' THEN 81000
    WHEN display_name LIKE '%근조%100%' THEN 95000
    WHEN display_name LIKE '%근조%120%' THEN 110000
    -- 축하화환 홈페이지 가격
    WHEN display_name LIKE '%축하%실속%' THEN 55000
    WHEN display_name LIKE '%축하%60%' THEN 67000
    WHEN display_name LIKE '%축하%80%' THEN 81000
    WHEN display_name LIKE '%축하%100%' THEN 95000
    ELSE customer_price
  END,
  florist_price = CASE
    -- 근조화환 화원가
    WHEN display_name LIKE '%근조%실속%' THEN 42000
    WHEN display_name LIKE '%근조%60%' THEN 60000
    WHEN display_name LIKE '%근조%80%' THEN 70000
    WHEN display_name LIKE '%근조%100%' THEN 80000
    WHEN display_name LIKE '%근조%120%' THEN 90000
    -- 축하화환 화원가
    WHEN display_name LIKE '%축하%실속%' THEN 42000
    WHEN display_name LIKE '%축하%60%' THEN 60000
    WHEN display_name LIKE '%축하%80%' THEN 70000
    WHEN display_name LIKE '%축하%100%' THEN 80000
    ELSE florist_price
  END,
  price = CASE
    -- price 필드도 customer_price와 동일하게 (하위호환)
    WHEN display_name LIKE '%근조%실속%' THEN 55000
    WHEN display_name LIKE '%근조%60%' THEN 67000
    WHEN display_name LIKE '%근조%80%' THEN 81000
    WHEN display_name LIKE '%근조%100%' THEN 95000
    WHEN display_name LIKE '%축하%실속%' THEN 55000
    WHEN display_name LIKE '%축하%60%' THEN 67000
    WHEN display_name LIKE '%축하%80%' THEN 81000
    WHEN display_name LIKE '%축하%100%' THEN 95000
    ELSE price
  END
WHERE display_name LIKE '%화환%';

-- 3. 120송이 근조화환 추가 (없으면)
INSERT INTO products (
  display_name, base_name, florist_name,
  customer_price, florist_price, price,
  category_1, category_2,
  flower_count, grade,
  is_active, sort_order
) VALUES (
  '120송이 근조화환', '근조화환', '근조화환 프리미엄',
  110000, 90000, 110000,
  '장례식', '근조화환',
  120, '프리미엄',
  true, 5
) ON CONFLICT DO NOTHING;

-- 4. 확인
SELECT 
  display_name,
  customer_price as "홈페이지가",
  florist_price as "화원가",
  ROUND((customer_price - florist_price)::numeric / customer_price * 100, 1) as "마진율%"
FROM products
WHERE display_name LIKE '%화환%'
ORDER BY category_1, flower_count;