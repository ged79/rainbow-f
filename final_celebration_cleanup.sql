-- 축하화환 최종 정리

-- 1. 불필요한 상품 삭제
DELETE FROM products WHERE category_1 IN ('결혼식', '개업·행사', '승진·기념일') 
  AND category_2 NOT IN ('축하화환');

-- 2. 결혼식 축하화환 정리
DELETE FROM products WHERE category_1 = '결혼식' AND category_2 = '축하화환';
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order, florist_name, grade, flower_count)
VALUES
  ('축하화환', '5단 축하화환', '결혼식', '축하화환', 145000, 105000, 145000, '/120송이 축하화환.jpg', '결혼을 축하합니다', true, 1, '축하화환', '실속', 120),
  ('축하화환', '4단 축하화환', '결혼식', '축하화환', 125000, 90000, 125000, '/100송이 축하화환.jpg', '결혼을 축하합니다', true, 2, '축하화환', '실속', 100),
  ('축하화환', '3단 축하화환2', '결혼식', '축하화환', 105000, 75000, 105000, '/80송이 축하화환.jpg', '결혼을 축하합니다', true, 3, '축하화환', '실속', 80),
  ('축하화환', '3단 축하화환', '결혼식', '축하화환', 85000, 60000, 85000, '/60송이 축하화환.jpg', '결혼을 축하합니다', true, 4, '축하화환', '실속', 60),
  ('축하화환', '실속 축하화환', '결혼식', '축하화환', 65000, 45000, 65000, '/실속 축하화환.jpg', '결혼을 축하합니다', true, 5, '축하화환', '실속', 50);

-- 3. 개업화환 정리
DELETE FROM products WHERE category_1 = '개업·행사' AND category_2 = '축하화환';
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order, florist_name, grade, flower_count)
VALUES
  ('축하화환', '5단 개업화환', '개업·행사', '축하화환', 145000, 105000, 145000, '/120송이 축하화환.jpg', '개업을 축하합니다', true, 1, '축하화환', '실속', 120),
  ('축하화환', '4단 개업화환', '개업·행사', '축하화환', 125000, 90000, 125000, '/100송이 축하화환.jpg', '개업을 축하합니다', true, 2, '축하화환', '실속', 100),
  ('축하화환', '3단 개업화환2', '개업·행사', '축하화환', 105000, 75000, 105000, '/80송이 축하화환.jpg', '개업을 축하합니다', true, 3, '축하화환', '실속', 80),
  ('축하화환', '3단 개업화환', '개업·행사', '축하화환', 85000, 60000, 85000, '/60송이 축하화환.jpg', '개업을 축하합니다', true, 4, '축하화환', '실속', 60),
  ('축하화환', '실속 개업화환', '개업·행사', '축하화환', 65000, 45000, 65000, '/실속 축하화환.jpg', '개업을 축하합니다', true, 5, '축하화환', '실속', 50);

-- 4. 승진화환 정리
DELETE FROM products WHERE category_1 = '승진·기념일' AND category_2 = '축하화환';
INSERT INTO products (base_name, display_name, category_1, category_2, customer_price, florist_price, price, image_url, description, is_active, sort_order, florist_name, grade, flower_count)
VALUES
  ('축하화환', '5단 승진화환', '승진·기념일', '축하화환', 145000, 105000, 145000, '/120송이 축하화환.jpg', '승진을 축하합니다', true, 1, '축하화환', '실속', 120),
  ('축하화환', '4단 승진화환', '승진·기념일', '축하화환', 125000, 90000, 125000, '/100송이 축하화환.jpg', '승진을 축하합니다', true, 2, '축하화환', '실속', 100),
  ('축하화환', '3단 승진화환2', '승진·기념일', '축하화환', 105000, 75000, 105000, '/80송이 축하화환.jpg', '승진을 축하합니다', true, 3, '축하화환', '실속', 80),
  ('축하화환', '3단 승진화환', '승진·기념일', '축하화환', 85000, 60000, 85000, '/60송이 축하화환.jpg', '승진을 축하합니다', true, 4, '축하화환', '실속', 60),
  ('축하화환', '실속 승진화환', '승진·기념일', '축하화환', 65000, 45000, 65000, '/실속 축하화환.jpg', '승진을 축하합니다', true, 5, '축하화환', '실속', 50);

-- 확인
SELECT category_1, display_name, customer_price FROM products WHERE is_active = true ORDER BY category_1, customer_price DESC;