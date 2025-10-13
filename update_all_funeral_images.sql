-- 모든 장례식 상품 이미지를 public 폴더 경로로 업데이트
UPDATE products
SET image_url = CASE 
    WHEN display_name = '120송이 근조화환' THEN '/120송이 근조화환.jpg'
    WHEN display_name = '100송이 근조화환' THEN '/100송이 근조화환.jpg'
    WHEN display_name = '80송이 근조화환' THEN '/80송이 근조화환.jpg'
    WHEN display_name = '60송이 근조화환' THEN '/60송이 근조화환.jpg'
    WHEN display_name = '영정바구니' THEN '/영정바구니.jpg'
    WHEN display_name = '근조꽃바구니/용수바구니' THEN '/근조꽃바구니.jpg'
    WHEN display_name = '근조장구 2단' THEN '/근조장구 2단.jpg'
    WHEN display_name = '근조장구 1단' THEN '/근조장구 1단.jpg'
    ELSE image_url
  END
WHERE category_1 = '장례식';

-- 확인
SELECT display_name, image_url
FROM products
WHERE category_1 = '장례식' 
  AND is_active = true;