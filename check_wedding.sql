-- 결혼식 카테고리 현황 확인
SELECT 
  display_name,
  category_2,
  customer_price,
  is_active
FROM products
WHERE category_1 = '결혼식'
ORDER BY is_active DESC, customer_price DESC;