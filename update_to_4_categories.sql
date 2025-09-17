-- 4개 카테고리 체계로 업데이트
-- 실행 전 백업 필수!

-- 1. 기존 주문 카테고리 매핑 업데이트
UPDATE orders
SET product_type = CASE
    WHEN product_type = '근조화환' THEN '장례식 화환'
    WHEN product_type = '축하화환' THEN '개업.행사'
    WHEN product_type = '관엽화분' THEN '개업.행사'
    WHEN product_type = '화분' THEN '개업.행사'
    WHEN product_type = '꽃바구니' THEN '결혼식 화환'
    WHEN product_type = '꽃다발' THEN '승진.기념일'
    WHEN product_type = '서양란' THEN '승진.기념일'
    WHEN product_type = '난' THEN '승진.기념일'
    ELSE product_type
END
WHERE product_type IN ('근조화환', '축하화환', '관엽화분', '화분', '꽃바구니', '꽃다발', '서양란', '난');

-- 2. customer_orders 테이블도 업데이트
UPDATE customer_orders
SET mapped_category = CASE
    WHEN mapped_category = '근조화환' THEN '장례식 화환'
    WHEN mapped_category = '축하화환' THEN '개업.행사'
    WHEN mapped_category = '관엽화분' THEN '개업.행사'
    WHEN mapped_category = '화분' THEN '개업.행사'
    WHEN mapped_category = '꽃바구니' THEN '결혼식 화환'
    WHEN mapped_category = '꽃다발' THEN '승진.기념일'
    WHEN mapped_category = '서양란' THEN '승진.기념일'
    WHEN mapped_category = '난' THEN '승진.기념일'
    ELSE mapped_category
END
WHERE mapped_category IN ('근조화환', '축하화환', '관엽화분', '화분', '꽃바구니', '꽃다발', '서양란', '난');

-- 3. 가격 기본값 업데이트
UPDATE orders
SET product_price = CASE
    WHEN product_type = '장례식 화환' AND product_price < 60000 THEN 67000
    WHEN product_type = '결혼식 화환' AND product_price < 60000 THEN 80000
    WHEN product_type = '개업.행사' AND product_price < 60000 THEN 80000
    WHEN product_type = '승진.기념일' AND product_price < 60000 THEN 86000
    ELSE product_price
END
WHERE created_at >= NOW() - INTERVAL '30 days';

-- 4. 카테고리별 통계 확인
SELECT 
    product_type as "카테고리",
    COUNT(*) as "주문수",
    AVG(product_price) as "평균가격",
    MIN(product_price) as "최저가",
    MAX(product_price) as "최고가"
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY product_type
ORDER BY COUNT(*) DESC;