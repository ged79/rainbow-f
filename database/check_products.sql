-- products 테이블의 카테고리 데이터 확인
SELECT DISTINCT category_1, category_2 FROM products WHERE is_active = true;

-- 카테고리별 상품 수
SELECT category_1, COUNT(*) as count 
FROM products 
WHERE is_active = true 
GROUP BY category_1;

-- 전체 상품 확인
SELECT id, display_name, category_1, category_2, price 
FROM products 
WHERE is_active = true 
ORDER BY category_1, sort_order;
