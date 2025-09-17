-- Performance Optimization Indexes
-- 영향도: LOW - 성능 개선만, 다운타임 없음
-- 실행 시간: 각 인덱스당 ~1-2초 (데이터량에 따라 다름)

-- 1. Homepage 주문 조회 최적화
CREATE INDEX IF NOT EXISTS idx_customer_orders_phone 
ON customer_orders(customer_phone);

CREATE INDEX IF NOT EXISTS idx_customer_orders_name 
ON customer_orders(customer_name);

CREATE INDEX IF NOT EXISTS idx_customer_orders_lookup 
ON customer_orders(customer_name, customer_phone);

-- 2. Client/Admin 주문 관리 최적화  
CREATE INDEX IF NOT EXISTS idx_orders_number 
ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_orders_created 
ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status, created_at DESC);

-- 3. 정산 조회 최적화
CREATE INDEX IF NOT EXISTS idx_settlements_store 
ON settlements(store_id, period_start DESC);

-- 4. 포인트 거래 최적화
CREATE INDEX IF NOT EXISTS idx_points_store 
ON point_transactions(store_id, created_at DESC);

-- 5. 쿠폰 조회 최적화
CREATE INDEX IF NOT EXISTS idx_coupons_phone 
ON coupons(customer_phone, used_at, expires_at);

-- 실행 후 확인
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
