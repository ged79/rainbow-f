-- 60송이와 80송이 축하화환 이미지 URL 확인
SELECT 
  id,
  display_name,
  image_url,
  category_1,
  category_2
FROM products
WHERE display_name LIKE '%60송이%' 
   OR display_name LIKE '%80송이%'
   OR (display_name LIKE '%축하화환%' AND display_name LIKE '%송이%')
ORDER BY display_name;