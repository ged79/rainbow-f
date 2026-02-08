-- 모든 카테고리 현황 요약
SELECT 
  category_1,
  category_2,
  COUNT(*) as count,
  MIN(customer_price) as min_price,
  MAX(customer_price) as max_price
FROM products
WHERE is_active = true
  AND category_1 IN ('결혼식', '개업·행사', '승진·기념일')
GROUP BY category_1, category_2
ORDER BY category_1, category_2;