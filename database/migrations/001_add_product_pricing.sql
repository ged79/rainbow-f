-- products 테이블에 가격 관련 컬럼 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS customer_price INTEGER,
ADD COLUMN IF NOT EXISTS florist_price INTEGER,
ADD COLUMN IF NOT EXISTS florist_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS margin_rate DECIMAL(5,2) DEFAULT 30,
ADD COLUMN IF NOT EXISTS product_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS wreath_grade VARCHAR(10);

-- 기존 price 컬럼 데이터를 customer_price로 복사
UPDATE products 
SET customer_price = price 
WHERE customer_price IS NULL;

-- 화원가 자동 계산 (화환은 등급별, 나머지는 30% 마진)
UPDATE products SET
  florist_price = CASE
    -- 화환 등급별 고정가
    WHEN display_name LIKE '%실속%' THEN 45000
    WHEN display_name LIKE '%60송이%' THEN 60000
    WHEN display_name LIKE '%80송이%' THEN 70000
    WHEN display_name LIKE '%100송이%' THEN 80000
    -- 나머지는 30% 마진
    ELSE FLOOR(customer_price * 0.7)
  END,
  florist_name = CASE
    -- 근조화환
    WHEN display_name LIKE '%실속 근조%' THEN '근조화환 실속형'
    WHEN display_name LIKE '%60송이 근조%' THEN '근조화환 기본형'
    WHEN display_name LIKE '%80송이 근조%' THEN '근조화환 대형'
    WHEN display_name LIKE '%100송이 근조%' THEN '근조화환 특대형'
    -- 축하화환
    WHEN display_name LIKE '%실속 축하%' THEN '축하화환 실속형'
    WHEN display_name LIKE '%60송이 축하%' THEN '축하화환 기본형'
    WHEN display_name LIKE '%80송이 축하%' THEN '축하화환 대형'
    WHEN display_name LIKE '%100송이 축하%' THEN '축하화환 특대형'
    -- 나머지는 display_name 유지
    ELSE display_name
  END,
  wreath_grade = CASE
    WHEN display_name LIKE '%실속%' THEN '실속'
    WHEN display_name LIKE '%60송이%' THEN '기본'
    WHEN display_name LIKE '%80송이%' THEN '대'
    WHEN display_name LIKE '%100송이%' THEN '특대'
    ELSE NULL
  END,
  product_type = CASE
    WHEN category_2 LIKE '%화환%' THEN 'wreath'
    WHEN category_2 LIKE '%화분%' OR category_2 LIKE '%식물%' THEN 'plant'
    WHEN category_2 LIKE '%난%' THEN 'orchid'
    WHEN category_2 LIKE '%꽃다발%' OR category_2 LIKE '%꽃바구니%' THEN 'flower'
    ELSE 'other'
  END
WHERE florist_price IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_products_customer_price ON products(customer_price);
CREATE INDEX IF NOT EXISTS idx_products_florist_price ON products(florist_price);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_wreath_grade ON products(wreath_grade);
