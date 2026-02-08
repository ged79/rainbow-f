-- Admin 상품 관리에서 개업화환 확인
SELECT 
  display_name,
  customer_price,
  florist_price,
  price,
  category_1,
  category_2
FROM products
WHERE category_1 = '개업·행사'
  AND category_2 = '축하화환'
  AND is_active = true
ORDER BY flower_count DESC, sort_order;