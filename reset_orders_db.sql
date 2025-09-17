-- 주문 관련 데이터만 삭제 (사용자/가게 유지)
DELETE FROM assignment_history;
DELETE FROM orders;
DELETE FROM point_transactions;
DELETE FROM settlements;
DELETE FROM settlement_items;

-- stores 포인트 잔액만 리셋
UPDATE stores SET points_balance = 0;

-- 테스트용 초기 포인트 충전
INSERT INTO point_transactions (store_id, type, amount, balance_before, balance_after, description)
SELECT 
    id, 
    'charge', 
    1000000, 
    0, 
    1000000, 
    '초기 충전'
FROM stores;

UPDATE stores SET points_balance = 1000000;

-- 확인
SELECT business_name, points_balance FROM stores;