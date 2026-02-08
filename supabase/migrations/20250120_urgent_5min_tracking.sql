-- =============================================
-- 주문 대기 시간 기반 긴급도 관리
-- 5분부터 시작하는 더 엄격한 관리
-- =============================================

-- 1. 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_accepted_at ON orders;

-- 2. 새로운 긴급도 트리거 함수 (pending 상태 기준)
CREATE OR REPLACE FUNCTION update_order_urgency()
RETURNS TRIGGER AS $$
BEGIN
    -- 상태가 accepted로 변경될 때
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        NEW.accepted_at = NOW();
        IF NEW.expected_delivery_at IS NULL THEN
            NEW.expected_delivery_at = NOW() + INTERVAL '2 hours';
        END IF;
    END IF;
    
    -- pending 상태의 긴급도 계산 (주문 생성 시간 기준)
    IF NEW.status = 'pending' THEN
        DECLARE
            time_elapsed INTERVAL;
        BEGIN
            time_elapsed := NOW() - NEW.created_at;
            
            IF time_elapsed > INTERVAL '30 minutes' THEN
                NEW.urgency_level = 'critical';
            ELSIF time_elapsed > INTERVAL '15 minutes' THEN
                NEW.urgency_level = 'high';
            ELSIF time_elapsed > INTERVAL '5 minutes' THEN
                NEW.urgency_level = 'medium';
            ELSE
                NEW.urgency_level = 'normal';
            END IF;
        END;
    END IF;
    
    -- accepted 상태의 긴급도 계산 (수락 시간 기준)
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

-- 3. 트리거 재생성
CREATE TRIGGER trigger_update_order_urgency
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_urgency();

-- 4. 5분 자동 알림 함수
CREATE OR REPLACE FUNCTION check_pending_orders_5min()
RETURNS void AS $$
BEGIN
    -- 5분 경과한 pending 주문에 대해 알림
    INSERT INTO notifications (
        store_id,
        type,
        priority,
        title,
        message,
        order_id,
        created_at
    )
    SELECT 
        o.receiver_store_id,
        'order',
        'urgent',
        '⚠️ 긴급: 5분 경과 미수락 주문',
        '주문번호 ' || o.order_number || '이(가) 5분째 대기 중입니다. 즉시 확인하세요!',
        o.id,
        NOW()
    FROM orders o
    WHERE o.status = 'pending'
    AND o.created_at <= NOW() - INTERVAL '5 minutes'
    AND o.created_at > NOW() - INTERVAL '6 minutes'  -- 중복 알림 방지
    AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.order_id = o.id 
        AND n.created_at > NOW() - INTERVAL '5 minutes'
    );
    
    -- receiver_store_id가 없는 경우 본사 알림
    INSERT INTO notifications (
        store_id,
        type,
        priority,
        title,
        message,
        order_id,
        created_at
    )
    SELECT 
        NULL,  -- 본사 알림용
        'order',
        'urgent',
        '⚠️ 본사 배정 필요: 5분 경과',
        '주문번호 ' || o.order_number || ' - 미배정 주문이 5분째 대기 중입니다.',
        o.id,
        NOW()
    FROM orders o
    WHERE o.status = 'pending'
    AND o.receiver_store_id IS NULL
    AND o.created_at <= NOW() - INTERVAL '5 minutes'
    AND o.created_at > NOW() - INTERVAL '6 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 긴급 주문 모니터링 뷰 (pending 포함)
CREATE OR REPLACE VIEW urgent_orders_monitor AS
SELECT 
    o.*,
    CASE 
        WHEN o.status = 'pending' THEN EXTRACT(EPOCH FROM (NOW() - o.created_at))/60
        WHEN o.status IN ('accepted', 'preparing', 'delivering') THEN EXTRACT(EPOCH FROM (NOW() - o.accepted_at))/60
        ELSE 0
    END AS minutes_elapsed,
    CASE 
        WHEN o.status = 'pending' THEN
            CASE
                WHEN NOW() - o.created_at > INTERVAL '30 minutes' THEN 'critical'
                WHEN NOW() - o.created_at > INTERVAL '15 minutes' THEN 'high'
                WHEN NOW() - o.created_at > INTERVAL '5 minutes' THEN 'medium'
                ELSE 'normal'
            END
        WHEN o.status IN ('accepted', 'preparing', 'delivering') AND o.accepted_at IS NOT NULL THEN
            CASE
                WHEN NOW() - o.accepted_at > INTERVAL '2 hours' THEN 'critical'
                WHEN NOW() - o.accepted_at > INTERVAL '1 hour' THEN 'high'
                WHEN NOW() - o.accepted_at > INTERVAL '30 minutes' THEN 'medium'
                ELSE 'normal'
            END
        ELSE 'normal'
    END AS calculated_urgency,
    s1.business_name AS sender_name,
    s1.phone AS sender_phone,
    s2.business_name AS receiver_name,
    s2.phone AS receiver_phone
FROM orders o
LEFT JOIN stores s1 ON o.sender_store_id = s1.id
LEFT JOIN stores s2 ON o.receiver_store_id = s2.id
WHERE o.status IN ('pending', 'accepted', 'preparing', 'delivering')
ORDER BY 
    CASE 
        WHEN o.status = 'pending' THEN 0
        ELSE 1
    END,
    CASE 
        WHEN o.status = 'pending' THEN o.created_at
        ELSE o.accepted_at
    END ASC;

-- 6. 기존 pending 주문들 긴급도 업데이트
UPDATE orders 
SET urgency_level = CASE
    WHEN NOW() - created_at > INTERVAL '30 minutes' THEN 'critical'
    WHEN NOW() - created_at > INTERVAL '15 minutes' THEN 'high'
    WHEN NOW() - created_at > INTERVAL '5 minutes' THEN 'medium'
    ELSE 'normal'
END
WHERE status = 'pending';

-- 7. 권한 설정
GRANT SELECT ON urgent_orders_monitor TO authenticated;
GRANT EXECUTE ON FUNCTION check_pending_orders_5min TO authenticated;

-- 8. 확인 쿼리
SELECT 
    status,
    urgency_level,
    COUNT(*) as count,
    MIN(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as min_minutes,
    MAX(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as max_minutes
FROM orders
WHERE status IN ('pending', 'accepted')
GROUP BY status, urgency_level
ORDER BY status, urgency_level;