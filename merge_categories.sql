-- products 테이블 카테고리 통합
-- 승진·기념일 → 개업·행사로 병합

UPDATE products 
SET category_1 = '개업·행사'
WHERE category_1 = '승진·기념일';

-- 확인
SELECT category_1, COUNT(*) 
FROM products 
WHERE is_active = true
GROUP BY category_1;