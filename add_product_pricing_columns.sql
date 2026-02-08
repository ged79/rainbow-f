-- products 테이블에 가격 분리 컬럼 추가
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS customer_price INTEGER,
ADD COLUMN IF NOT EXISTS florist_price INTEGER,
ADD COLUMN IF NOT EXISTS florist_name VARCHAR(255);

-- 기존 데이터 마이그레이션
UPDATE products 
SET 
  customer_price = price,
  florist_price = FLOOR(price * 0.7)
WHERE customer_price IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN products.customer_price IS '고객가 (홈페이지 표시)';
COMMENT ON COLUMN products.florist_price IS '화원가 (도매가)';
COMMENT ON COLUMN products.florist_name IS '화원 표시명';
