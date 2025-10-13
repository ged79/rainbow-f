-- 현재 영정바구니 이미지 경로 확인
SELECT id, display_name, image_url
FROM products
WHERE display_name = '영정바구니';

-- 강제 업데이트 (Supabase URL이 아닌 로컬 경로로)
UPDATE products
SET 
  image_url = '/영정바구니.jpg',
  updated_at = NOW()
WHERE display_name = '영정바구니';

-- 다시 확인
SELECT id, display_name, image_url, updated_at
FROM products
WHERE display_name = '영정바구니';