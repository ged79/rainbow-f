-- 영정바구니 추가
INSERT INTO products (
  base_name,
  display_name,
  grade,
  flower_count,
  price,
  category_1,
  category_2,
  image_url,
  description,
  sort_order,
  is_active,
  customer_price,
  florist_price,
  florist_name
) VALUES (
  '근조화환',
  '영정바구니',
  '실속',
  30,
  60000,
  '장례식',
  '근조꽃바구니',
  '/영정바구니.jpg',
  '고인을 추모하는 영정 앞 헌화용 바구니',
  10,
  true,
  60000,
  40000,
  '근조화환'
);

-- 확인
SELECT display_name, customer_price, image_url
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true
ORDER BY customer_price DESC;