// 포인트 수동 차감 스크립트
// Supabase SQL Editor에서 실행

-- 1. 오늘 주문 중 포인트 사용한 것 확인
SELECT id, customer_phone, discount_amount, created_at 
FROM customer_orders 
WHERE discount_amount > 0 
AND DATE(created_at) = CURRENT_DATE;

-- 2. 사용해야 할 쿠폰 확인
SELECT id, amount, customer_phone 
FROM coupons 
WHERE customer_phone = '010-7741-4569' 
AND used_at IS NULL
ORDER BY amount ASC;

-- 3. 수동으로 쿠폰 차감 (주문 ID와 쿠폰 ID 입력)
UPDATE coupons 
SET used_at = NOW(), 
    order_id = 'ORDER_ID_HERE'
WHERE id IN ('COUPON_ID_1', 'COUPON_ID_2')
AND customer_phone = '010-7741-4569';
