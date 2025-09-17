-- 화원가 매핑 시스템을 위한 orders 테이블 수정
-- 실행일: 2025-01-23

-- 1. orders 테이블에 가격 관련 컬럼 추가
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_price INTEGER,           -- 고객 지불가 (Homepage 표시가)
ADD COLUMN IF NOT EXISTS florist_price INTEGER,            -- 화원 수령가 (도매가)
ADD COLUMN IF NOT EXISTS price_grade VARCHAR(20),          -- 가격 등급 (실속/기본/대/특대/프리미엄)
ADD COLUMN IF NOT EXISTS margin_amount INTEGER,            -- 마진 (customer_price - florist_price)
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.0,  -- 수수료율 (%)
ADD COLUMN IF NOT EXISTS commission_amount INTEGER,        -- 수수료 금액
ADD COLUMN IF NOT EXISTS settlement_amount INTEGER;        -- 화원 정산금 (florist_price - commission)

-- 2. 기존 데이터 마이그레이션 (product_price를 기준으로)
UPDATE orders 
SET 
  customer_price = product_price,  -- 기존 product_price를 고객가로
  florist_price = CASE
    -- 근조화환 매핑
    WHEN product_name = '근조화환 40송이' THEN 45000
    WHEN product_name = '근조화환 60송이' THEN 60000
    WHEN product_name = '근조화환 80송이' THEN 70000
    WHEN product_name = '근조화환 100송이' THEN 80000
    WHEN product_name = '근조꽃바구니' THEN 45000
    WHEN product_name = '근조장구 1단' THEN 80000
    WHEN product_name = '근조장구 2단' THEN 90000
    
    -- 축하화환 매핑
    WHEN product_name = '축하화환 40송이' THEN 45000
    WHEN product_name = '축하화환 60송이' THEN 60000
    WHEN product_name = '축하화환 80송이' THEN 70000
    WHEN product_name = '축하화환 100송이' THEN 80000
    
    -- 화분·난 매핑
    WHEN product_name = '탁상용 금전수' THEN 45000
    WHEN product_name = '금전수' THEN 80000
    WHEN product_name = '대형 해피트리' THEN 90000
    WHEN product_name = '아레카야자' THEN 80000
    WHEN product_name = '초대형 뱅갈고무나무' THEN 90000
    WHEN product_name = '동양란' THEN 60000
    WHEN product_name = '서양란' THEN 70000
    WHEN product_name = '호접란' THEN 80000
    WHEN product_name = '만천홍' THEN 70000
    WHEN product_name = '그라데이션 호접란' THEN 70000
    
    -- 꽃상품 매핑
    WHEN product_name = '꽃다발 소' THEN 45000
    WHEN product_name = '꽃다발 중' THEN 80000
    WHEN product_name = '꽃다발 대' THEN 90000
    WHEN product_name = '꽃바구니' THEN 70000
    WHEN product_name = '프리미엄 꽃바구니' THEN 90000
    
    -- 기본값 (매핑 없는 경우)
    ELSE product_price
  END,
  price_grade = CASE
    WHEN product_price <= 60000 THEN '실속'
    WHEN product_price <= 70000 THEN '기본'
    WHEN product_price <= 80000 THEN '대'
    WHEN product_price <= 95000 THEN '특대'
    ELSE '프리미엄'
  END
WHERE customer_price IS NULL;

-- 3. 마진 및 정산금 계산
UPDATE orders
SET 
  margin_amount = customer_price - florist_price,
  commission_amount = FLOOR(florist_price * (commission_rate / 100)),
  settlement_amount = florist_price - FLOOR(florist_price * (commission_rate / 100))
WHERE margin_amount IS NULL;

-- 4. 인덱스 추가 (성능 개선)
CREATE INDEX IF NOT EXISTS idx_orders_price_grade ON orders(price_grade);
CREATE INDEX IF NOT EXISTS idx_orders_florist_price ON orders(florist_price);
CREATE INDEX IF NOT EXISTS idx_orders_settlement_amount ON orders(settlement_amount);

-- 5. 코멘트 추가
COMMENT ON COLUMN orders.customer_price IS '고객 지불가격 (Homepage 표시가)';
COMMENT ON COLUMN orders.florist_price IS '화원 수령가격 (도매가)';
COMMENT ON COLUMN orders.price_grade IS '가격 등급 (실속/기본/대/특대/프리미엄)';
COMMENT ON COLUMN orders.margin_amount IS '마진 금액 (customer_price - florist_price)';
COMMENT ON COLUMN orders.commission_rate IS '수수료율 (%)';
COMMENT ON COLUMN orders.commission_amount IS '수수료 금액';
COMMENT ON COLUMN orders.settlement_amount IS '화원 정산금 (florist_price - commission_amount)';
