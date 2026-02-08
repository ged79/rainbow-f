-- 영정바구니 현재 상태 확인
SELECT id, display_name, image_url
FROM products
WHERE display_name = '영정바구니';

-- Supabase Storage URL 형식으로 업데이트
UPDATE products
SET image_url = 'https://qvgxqluwumbgslbxaeaq.supabase.co/storage/v1/object/public/product_images/영정바구니.jpg'
WHERE display_name = '영정바구니';

-- 또는 public 폴더 이미지 사용 (상대경로)
-- UPDATE products
-- SET image_url = '/영정바구니.jpg'
-- WHERE display_name = '영정바구니';

-- 다른 근조화환 이미지 경로도 확인
SELECT display_name, image_url
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true;