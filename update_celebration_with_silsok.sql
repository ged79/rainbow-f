-- 축하화환 정리 (실속화환 유지, 가격 조정)
-- 가격: 실속 6.5만 / 60송이 8.5만 / 80송이 10.5만 / 100송이 12.5만 / 120송이 14.5만

-- 1. 결혼식 축하화환 가격 조정
UPDATE products
SET 
  customer_price = CASE
    WHEN display_name = '100송이 축하화환' THEN 125000
    WHEN display_name = '80송이 축하화환' THEN 105000
    WHEN display_name = '60송이 축하화환' THEN 85000
    WHEN display_name = '실속 축하화환' THEN 65000
    ELSE customer_price
  END,
  florist_price = CASE
    WHEN display_name = '100송이 축하화환' THEN 90000
    WHEN display_name = '80송이 축하화환' THEN 75000
    WHEN display_name = '60송이 축하화환' THEN 60000
    WHEN display_name = '실속 축하화환' THEN 45000
    ELSE florist_price
  END,
  price = customer_price,
  is_active = true
WHERE category_1 = '결혼식' AND category_2 = '축하화환';

-- 120송이 추가
DELETE FROM products WHERE category_1 = '결혼식' AND display_name = '120송이 결혼축하화환';
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order, florist_name, grade, flower_count)
SELECT base_name, '120송이 결혼축하화환', '결혼식', '축하화환', 145000, 105000, 145000, '/120송이 축하화환.jpg', '결혼을 축하합니다', true, 1, florist_name, grade, 120
FROM products WHERE category_1 = '결혼식' AND category_2 = '축하화환' LIMIT 1;

-- 2. 개업·행사 축하화환 
UPDATE products
SET 
  customer_price = CASE
    WHEN display_name = '100송이 축하화환' THEN 125000
    WHEN display_name = '80송이 축하화환' THEN 105000
    WHEN display_name = '60송이 축하화환' THEN 85000
    WHEN display_name = '실속 축하화환' THEN 65000
    ELSE customer_price
  END,
  florist_price = CASE
    WHEN display_name = '100송이 축하화환' THEN 90000
    WHEN display_name = '80송이 축하화환' THEN 75000
    WHEN display_name = '60송이 축하화환' THEN 60000
    WHEN display_name = '실속 축하화환' THEN 45000
    ELSE florist_price
  END,
  price = customer_price,
  is_active = true
WHERE category_1 = '개업·행사' AND category_2 = '축하화환';

-- 120송이 개업화환 추가
DELETE FROM products WHERE category_1 = '개업·행사' AND display_name = '120송이 개업화환';
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order, florist_name, grade, flower_count)
SELECT base_name, '120송이 개업화환', '개업·행사', '축하화환', 145000, 105000, 145000, '/120송이 축하화환.jpg', '개업을 축하합니다', true, 1, florist_name, grade, 120
FROM products WHERE category_1 = '개업·행사' AND category_2 = '축하화환' LIMIT 1;

-- 3. 승진·기념일 추가
DELETE FROM products WHERE category_1 = '승진·기념일' AND category_2 = '축하화환';
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order, florist_name, grade, flower_count)
VALUES
  ('축하화환', '120송이 승진화환', '승진·기념일', '축하화환', 145000, 105000, 145000, '/120송이 축하화환.jpg', '승진을 축하합니다', true, 1, '축하화환', '실속', 120),
  ('축하화환', '100송이 승진화환', '승진·기념일', '축하화환', 125000, 90000, 125000, '/100송이 축하화환.jpg', '승진을 축하합니다', true, 2, '축하화환', '실속', 100),
  ('축하화환', '80송이 승진화환', '승진·기념일', '축하화환', 105000, 75000, 105000, '/80송이 축하화환.jpg', '승진을 축하합니다', true, 3, '축하화환', '실속', 80),
  ('축하화환', '60송이 승진화환', '승진·기념일', '축하화환', 85000, 60000, 85000, '/60송이 축하화환.jpg', '승진을 축하합니다', true, 4, '축하화환', '실속', 60),
  ('축하화환', '실속 승진화환', '승진·기념일', '축하화환', 65000, 45000, 65000, '/실속 축하화환.jpg', '승진을 축하합니다', true, 5, '축하화환', '실속', 50);

-- 확인
SELECT category_1, display_name, customer_price
FROM products 
WHERE category_2 = '축하화환' AND is_active = true
ORDER BY category_1, customer_price DESC;