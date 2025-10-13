-- 영정바구니 이미지 경로 확인
SELECT id, display_name, image_url
FROM products
WHERE display_name = '영정바구니';

-- 혹시 중복된 영정바구니가 있는지 확인
SELECT id, display_name, image_url, is_active
FROM products
WHERE display_name LIKE '%영정%'
ORDER BY created_at DESC;