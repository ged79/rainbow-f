-- 축하화환 정리 및 리본문구 추가
-- 1. 결혼식 화환 정리
UPDATE products
SET 
  display_name = CASE
    WHEN customer_price = 155000 THEN '120송이 결혼축하화환'
    WHEN customer_price = 135000 THEN '100송이 결혼축하화환'  
    WHEN customer_price = 115000 THEN '80송이 결혼축하화환'
    WHEN customer_price = 95000 THEN '60송이 결혼축하화환'
    ELSE display_name
  END,
  customer_price = CASE
    WHEN display_name = '100송이 축하화환' THEN 135000
    WHEN display_name = '80송이 축하화환' THEN 115000
    WHEN display_name = '60송이 축하화환' THEN 95000
    ELSE customer_price
  END,
  florist_price = CASE
    WHEN display_name = '100송이 축하화환' THEN 95000
    WHEN display_name = '80송이 축하화환' THEN 80000
    WHEN display_name = '60송이 축하화환' THEN 65000
    ELSE florist_price
  END,
  description = '결혼을 축하합니다 / 화목한 가정 이루세요'
WHERE category_1 = '결혼식' AND category_2 = '축하화환' AND is_active = true;

-- 2. 개업화환으로 변경
UPDATE products
SET 
  display_name = REPLACE(display_name, '축하화환', '개업화환'),
  description = '개업을 축하합니다 / 사업번창 하세요'
WHERE category_1 = '개업·행사' AND category_2 = '축하화환' AND is_active = true;

-- 3. 승진화환 추가 (개업화환 복사)
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order)
SELECT 
  base_name, 
  REPLACE(display_name, '개업', '승진'),
  '승진·기념일',
  '축하화환',
  customer_price,
  florist_price,
  price,
  image_url,
  '승진을 축하합니다 / 더 큰 영광 있기를',
  true,
  sort_order
FROM products 
WHERE category_1 = '개업·행사' AND category_2 = '축하화환' AND is_active = true;