-- 이미지 경로 업데이트
UPDATE products
SET image_url = '/120송이 근조화환.jpg'
WHERE display_name = '120송이 근조화환';

UPDATE products
SET image_url = '/영정바구니.jpg'
WHERE display_name = '영정바구니';

-- 확인
SELECT display_name, image_url
FROM products
WHERE display_name IN ('120송이 근조화환', '영정바구니');