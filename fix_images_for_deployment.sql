-- 배포를 위한 이미지 경로 수정
-- public 폴더 이미지는 Next.js가 자동으로 처리

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

-- 결혼식 상품도 수정
UPDATE products
SET image_url = CASE 
    WHEN display_name = '100송이 축하화환' THEN '/100송이 축하화환.jpg'
    WHEN display_name = '80송이 축하화환' THEN '/80송이 축하화환.jpg'
    WHEN display_name = '60송이 축하화환' THEN '/60송이 축하화환.jpg'
    WHEN display_name = '실속 축하화환' THEN '/실속 축하화환.jpg'
    ELSE image_url
  END
WHERE category_1 IN ('결혼식', '개업·행사');

-- 확인
SELECT category_1, display_name, image_url
FROM products
WHERE is_active = true
ORDER BY category_1, display_name;