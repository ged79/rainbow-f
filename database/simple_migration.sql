-- Supabase SQL Editor에서 실행하세요
-- 필수 컬럼만 추가하는 간단한 버전

-- 1단계: 가격 컬럼 추가 (없으면 생성)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS customer_price INTEGER;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS florist_price INTEGER;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS florist_name VARCHAR(100);

-- 2단계: 기존 price를 customer_price로 복사
UPDATE products 
SET customer_price = price 
WHERE customer_price IS NULL;

-- 3단계: 화원가 자동 계산 (화환은 등급별, 나머지는 30% 마진)
UPDATE products 
SET florist_price = CASE
  WHEN display_name LIKE '%실속%' THEN 45000
  WHEN display_name LIKE '%60송이%' THEN 60000
  WHEN display_name LIKE '%80송이%' THEN 70000
  WHEN display_name LIKE '%100송이%' THEN 80000
  ELSE FLOOR(COALESCE(customer_price, price) * 0.7)
END
WHERE florist_price IS NULL;

-- 4단계: 화원 표시명 설정
UPDATE products 
SET florist_name = display_name
WHERE florist_name IS NULL;
