-- 실속 축하화환 이미지를 60송이 축하화환으로 변경
UPDATE products
SET image_url = '/60송이 축하화환.jpg'
WHERE display_name LIKE '실속%화환' 
  AND category_1 IN ('결혼식', '개업·행사', '승진·기념일');

-- 확인
SELECT display_name, image_url 
FROM products 
WHERE display_name LIKE '실속%' 
  AND category_2 = '축하화환';