-- 모든 장례식 상품의 이미지 경로 확인
SELECT display_name, image_url
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true
ORDER BY display_name;

-- 작동하는 상품의 이미지 경로 패턴 확인
SELECT display_name, image_url
FROM products
WHERE display_name IN ('100송이 근조화환', '80송이 근조화환');