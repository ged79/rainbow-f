-- =============================================
-- 화환 전문 쇼핑몰 DB 재구성 계획
-- 작성일: 2024.01.10
-- =============================================

-- 1. 현재 상태 백업 (필수!)
-- =============================================
CREATE TABLE IF NOT EXISTS products_backup_20240110 AS 
SELECT * FROM products;

-- 2. 화환 외 상품 비활성화
-- =============================================
-- 화환이 아닌 상품들 비활성화
UPDATE products 
SET 
  is_active = false,
  updated_at = NOW()
WHERE is_active = true
  AND category_2 NOT IN ('축하화환', '근조화환')
  AND category_2 NOT LIKE '%화환%';

-- 확인
SELECT category_1, category_2, COUNT(*) 
FROM products 
WHERE is_active = true 
GROUP BY category_1, category_2;

-- 3. 기존 화환 상품 업데이트 (가격/크기 세분화)
-- =============================================

-- 3-1. 근조화환 세분화
UPDATE products
SET 
  category_2 = '근조화환(3단)',
  customer_price = 150000,
  florist_price = 100000,
  updated_at = NOW()
WHERE category_1 = '장례식' 
  AND display_name IN ('100송이 근조화환', '60송이 근조화환');

UPDATE products
SET 
  category_2 = '근조화환(5단)',
  customer_price = 250000,
  florist_price = 170000,
  updated_at = NOW()
WHERE category_1 = '장례식' 
  AND display_name IN ('80송이 근조화환', '실속 근조화환');

-- 3-2. 개업 축하화환 세분화
UPDATE products
SET 
  category_2 = '개업화환(3단)',
  customer_price = 150000,
  florist_price = 100000,
  updated_at = NOW()
WHERE category_1 = '개업·행사' 
  AND display_name IN ('100송이 축하화환', '60송이 축하화환');

UPDATE products
SET 
  category_2 = '개업화환(5단)',
  customer_price = 250000,
  florist_price = 170000,
  updated_at = NOW()
WHERE category_1 = '개업·행사' 
  AND display_name IN ('80송이 축하화환', '실속 축하화환');

-- 3-3. 결혼 축하화환 세분화
UPDATE products
SET 
  category_2 = '결혼축하화환(3단)',
  customer_price = 150000,
  florist_price = 100000,
  updated_at = NOW()
WHERE category_1 = '결혼식' 
  AND display_name IN ('100송이 축하화환', '60송이 축하화환');

UPDATE products
SET 
  category_2 = '결혼축하화환(5단)',
  customer_price = 250000,
  florist_price = 170000,
  updated_at = NOW()
WHERE category_1 = '결혼식' 
  AND display_name IN ('80송이 축하화환', '실속 축하화환');

-- 4. 새로운 화환 상품 추가
-- =============================================

-- 4-1. 프리미엄 근조화환 추가
INSERT INTO products (
  display_name, category_1, category_2, 
  customer_price, florist_price, 
  description, image_url, is_active, sort_order
) VALUES 
('프리미엄 근조화환(특대)', '장례식', '근조화환(특대)', 
 350000, 250000, 
 '최고급 화환으로 깊은 애도를 표현합니다', '/images/funeral_premium.jpg', true, 1),
 
('VIP 근조화환(특대)', '장례식', '근조화환(특대)', 
 500000, 350000, 
 'VIP용 최고급 근조화환', '/images/funeral_vip.jpg', true, 2);

-- 4-2. 승진/당선 화환 추가
INSERT INTO products (
  display_name, category_1, category_2, 
  customer_price, florist_price, 
  description, image_url, is_active, sort_order
) VALUES 
('승진축하화환(3단)', '승진·기념일', '승진화환', 
 150000, 100000, 
 '승진을 축하하는 품격있는 화환', '/images/promotion_3.jpg', true, 1),
 
('승진축하화환(5단)', '승진·기념일', '승진화환', 
 250000, 170000, 
 '승진을 축하하는 대형 화환', '/images/promotion_5.jpg', true, 2),
 
('당선축하화환(3단)', '승진·기념일', '당선화환', 
 150000, 100000, 
 '당선을 축하하는 화환', '/images/election_3.jpg', true, 3),
 
('당선축하화환(5단)', '승진·기념일', '당선화환', 
 250000, 170000, 
 '당선을 축하하는 대형 화환', '/images/election_5.jpg', true, 4);

-- 4-3. 이전/오픈 화환 추가
INSERT INTO products (
  display_name, category_1, category_2, 
  customer_price, florist_price, 
  description, image_url, is_active, sort_order
) VALUES 
('이전축하화환(3단)', '개업·행사', '이전화환', 
 150000, 100000, 
 '사무실 이전을 축하하는 화환', '/images/moving_3.jpg', true, 5),
 
('이전축하화환(5단)', '개업·행사', '이전화환', 
 250000, 170000, 
 '사무실 이전을 축하하는 대형 화환', '/images/moving_5.jpg', true, 6);

-- 4-4. 특수 화환 추가
INSERT INTO products (
  display_name, category_1, category_2, 
  customer_price, florist_price, 
  description, image_url, is_active, sort_order
) VALUES 
('쌀화환 10kg', '개업·행사', '쌀화환', 
 200000, 150000, 
 '실용적인 쌀화환 (10kg x 10포)', '/images/rice_10.jpg', true, 7),
 
('쌀화환 20kg', '개업·행사', '쌀화환', 
 350000, 250000, 
 '실용적인 쌀화환 (20kg x 10포)', '/images/rice_20.jpg', true, 8);

-- 5. 최종 확인
-- =============================================
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

-- 6. 가격별 분포 확인
-- =============================================
SELECT 
  CASE 
    WHEN customer_price < 100000 THEN '10만원 미만'
    WHEN customer_price < 200000 THEN '10-20만원'
    WHEN customer_price < 300000 THEN '20-30만원'
    WHEN customer_price < 500000 THEN '30-50만원'
    ELSE '50만원 이상'
  END as price_range,
  COUNT(*) as count
FROM products
WHERE is_active = true
GROUP BY price_range
ORDER BY MIN(customer_price);

-- 7. 인덱스 추가 (성능 최적화)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products(category_1, category_2, is_active);

CREATE INDEX IF NOT EXISTS idx_products_price_range 
ON products(customer_price, is_active);
