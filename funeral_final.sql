-- =============================================
-- 장례식 상품 최종 작업
-- =============================================

-- 1. 실속 근조화환 비활성화
UPDATE products
SET is_active = false
WHERE display_name = '실속 근조화환';

-- 2. 기존 근조화환 가격 조정 (9.5/11.5/13.5)
UPDATE products
SET 
  customer_price = CASE 
    WHEN display_name = '60송이 근조화환' THEN 95000
    WHEN display_name = '80송이 근조화환' THEN 115000
    WHEN display_name = '100송이 근조화환' THEN 135000
    ELSE customer_price
  END,
  florist_price = CASE 
    WHEN display_name = '60송이 근조화환' THEN 65000
    WHEN display_name = '80송이 근조화환' THEN 80000
    WHEN display_name = '100송이 근조화환' THEN 95000
    ELSE florist_price
  END,
  price = CASE 
    WHEN display_name = '60송이 근조화환' THEN 95000
    WHEN display_name = '80송이 근조화환' THEN 115000
    WHEN display_name = '100송이 근조화환' THEN 135000
    ELSE price
  END
WHERE category_1 = '장례식' 
  AND category_2 = '근조화환'
  AND is_active = true;

-- 3. 120송이 근조화환 추가
DELETE FROM products WHERE display_name = '120송이 근조화환';

INSERT INTO products (
  base_name,
  display_name,
  grade,
  flower_count,
  price,
  category_1,
  category_2,
  image_url,
  description,
  sort_order,
  is_active,
  customer_price,
  florist_price,
  florist_name
) VALUES (
  '근조화환',
  '120송이 근조화환',
  '실속',
  120,
  155000,
  '장례식',
  '근조화환',
  'https://qvgxqluwumbgslbxaeaq.supabase.co/storage/v1/object/public/product_images/funeral_120.jpg',
  '깊은 애도를 전하는 프리미엄 120송이 근조화환',
  1,
  true,
  155000,
  110000,
  '근조화환'
);

-- 4. 영정바구니 추가
DELETE FROM products WHERE display_name = '영정바구니';

INSERT INTO products (
  base_name,
  display_name,
  grade,
  flower_count,
  price,
  category_1,
  category_2,
  image_url,
  description,
  sort_order,
  is_active,
  customer_price,
  florist_price,
  florist_name
) VALUES (
  '근조화환',
  '영정바구니',
  '실속',
  30,
  60000,
  '장례식',
  '근조꽃바구니',
  'https://qvgxqluwumbgslbxaeaq.supabase.co/storage/v1/object/public/product_images/funeral_basket.jpg',
  '고인을 추모하는 영정 앞 헌화용 바구니',
  10,
  true,
  60000,
  40000,
  '근조화환'
);

-- 5. 근조꽃바구니 이름 변경
UPDATE products
SET 
  display_name = '근조꽃바구니/용수바구니',
  description = '빈소에 놓는 근조꽃바구니 또는 용수바구니'
WHERE display_name = '근조꽃바구니'
  AND category_1 = '장례식';

-- 6. 확인
SELECT 
  display_name,
  category_2,
  customer_price,
  is_active
FROM products
WHERE category_1 = '장례식'
ORDER BY is_active DESC, customer_price DESC;