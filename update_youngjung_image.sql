-- 영정바구니 이미지 경로 업데이트
UPDATE products
SET image_url = '/영정바구니.jpg'
WHERE display_name = '영정바구니';

-- 확인
SELECT display_name, image_url
FROM products
WHERE display_name = '영정바구니';