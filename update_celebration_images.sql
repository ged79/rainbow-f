-- 축하화환 이미지 경로 업데이트
UPDATE products
SET image_url = CASE
  WHEN display_name LIKE '5단%' THEN '/5단축하화환.jpg'
  WHEN display_name LIKE '4단%' THEN '/4단축하화환.jpg'
  WHEN display_name LIKE '%화환2' THEN '/3단축하화환2.jpg'
  WHEN display_name LIKE '3단%' AND display_name NOT LIKE '%2' THEN '/3단축하화환.jpg'
  WHEN display_name LIKE '실속%' THEN '/실속 축하화환.jpg'
  ELSE image_url
END
WHERE category_1 IN ('결혼식', '개업·행사', '승진·기념일') 
  AND category_2 = '축하화환';

-- 확인
SELECT display_name, image_url FROM products 
WHERE category_2 = '축하화환' AND is_active = true;