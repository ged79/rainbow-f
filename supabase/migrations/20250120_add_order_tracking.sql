-- =============================================
-- 주문 추적 관리를 위한 필드 추가
-- =============================================

-- 1. orders 테이블에 추적 관련 컬럼 추가
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_delivery_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contact_history JSONB DEFAULT '[]'::jsonb;

-- 2. 인덱스 추가 (긴급 주문 빠른 조회용)
CREATE INDEX IF NOT EXISTS idx_orders_accepted_at ON orders(accepted_at) 
WHERE status = 'accepted' AND accepted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_urgency ON orders(urgency_level, status) 
WHERE status IN ('accepted', 'preparing', 'delivering');

-- 3. 수락 시 자동으로 accepted_at 기록하는 트리거
CREATE OR REPLACE FUNCTION update_accepted_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 상태가 accepted로 변경될 때
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        NEW.accepted_at = NOW();
        
        -- 예상 배송 시간 자동 설정 (수락 후 2시간)
        IF NEW.expected_delivery_at IS NULL THEN
            NEW.expected_delivery_at = NOW() + INTERVAL '2 hours';
        END IF;
    END IF;
    
    -- 긴급도 자동 계산 (accepted 상태일 때만)
    IF NEW.status IN ('accepted', 'preparing', 'delivering') AND NEW.accepted_at IS NOT NULL THEN
        DECLARE
            time_elapsed INTERVAL;
        BEGIN
            time_elapsed := NOW() - NEW.accepted_at;
            
            IF time_elapsed > INTERVAL '2 hours' THEN
                NEW.urgency_level = 'critical';
            ELSIF time_elapsed > INTERVAL '1 hour' THEN
                NEW.urgency_level = 'high';
            ELSIF time_elapsed > INTERVAL '30 minutes' THEN
                NEW.urgency_level = 'medium';
            ELSE
                NEW.urgency_level = 'normal';
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_accepted_at ON orders;
CREATE TRIGGER trigger_update_accepted_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_accepted_at();

-- 4. 연락 이력 추가 함수
CREATE OR REPLACE FUNCTION add_contact_attempt(
    p_order_id UUID,
    p_contact_type VARCHAR, -- 'sms', 'kakao', 'call'
    p_contact_to VARCHAR,
    p_message TEXT,
    p_success BOOLEAN DEFAULT false,
    p_response TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE orders
    SET 
        contact_attempts = contact_attempts + 1,
        last_contact_at = NOW(),
        contact_history = contact_history || jsonb_build_object(
            'timestamp', NOW(),
            'type', p_contact_type,
            'to', p_contact_to,
            'message', p_message,
            'success', p_success,
            'response', p_response
        )
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 긴급 주문 조회 뷰
CREATE OR REPLACE VIEW urgent_orders AS
SELECT 
    o.*,
    EXTRACT(EPOCH FROM (NOW() - o.accepted_at))/60 AS minutes_elapsed,
    CASE 
        WHEN NOW() - o.accepted_at > INTERVAL '2 hours' THEN 'critical'
        WHEN NOW() - o.accepted_at > INTERVAL '1 hour' THEN 'high'
        WHEN NOW() - o.accepted_at > INTERVAL '30 minutes' THEN 'medium'
        ELSE 'normal'
    END AS calculated_urgency,
    s1.business_name AS sender_name,
    s1.phone AS sender_phone,
    s2.business_name AS receiver_name,
    s2.phone AS receiver_phone
FROM orders o
LEFT JOIN stores s1 ON o.sender_store_id = s1.id
LEFT JOIN stores s2 ON o.receiver_store_id = s2.id
WHERE o.status IN ('accepted', 'preparing', 'delivering')
AND o.accepted_at IS NOT NULL
ORDER BY o.accepted_at ASC;

-- 6. 기존 accepted 상태 주문들의 accepted_at 백필
UPDATE orders 
SET accepted_at = updated_at
WHERE status = 'accepted' 
AND accepted_at IS NULL;

-- 7. 테스트 데이터 업데이트 (개발 환경용)
-- 일부 주문을 긴급 상태로 만들기
UPDATE orders 
SET 
    accepted_at = NOW() - INTERVAL '3 hours',
    urgency_level = 'critical'
WHERE status = 'accepted' 
LIMIT 1;

UPDATE orders 
SET 
    accepted_at = NOW() - INTERVAL '90 minutes',
    urgency_level = 'high'
WHERE status = 'accepted' 
AND accepted_at IS NULL
LIMIT 1;

-- 권한 설정
GRANT SELECT ON urgent_orders TO authenticated;
GRANT EXECUTE ON FUNCTION add_contact_attempt TO authenticated;