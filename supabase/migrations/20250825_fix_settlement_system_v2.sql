-- =============================================
-- 정산 시스템 수정 (2025-08-25)
-- 배송 완료 시 정산 예정, 금요일 일괄 지급
-- =============================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_process_order_completion ON orders;
DROP FUNCTION IF EXISTS process_order_completion() CASCADE;

-- 1. 주문 완료 시 정산 예정 기록만 생성 (포인트 지급 X)
CREATE OR REPLACE FUNCTION record_order_completion_for_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_store_id UUID;
    v_settlement_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_commission_rate DECIMAL(5,2) := 20.00; -- 수수료율 20%
    v_order_amount INTEGER;
    v_commission_amount INTEGER;
    v_net_amount INTEGER;
BEGIN
    -- 주문이 completed 상태가 되었을 때만 처리
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- 수주화원 정보
        v_store_id := NEW.receiver_store_id;
        
        -- NULL 체크
        IF v_store_id IS NULL THEN
            RAISE NOTICE 'No receiver store for order %', NEW.id;
            RETURN NEW;
        END IF;
        
        -- 주문 금액 계산
        v_order_amount := COALESCE((NEW.payment->>'total')::INTEGER, 0);
        v_commission_amount := FLOOR(v_order_amount * v_commission_rate / 100);
        v_net_amount := v_order_amount - v_commission_amount;
        
        -- 정산 기간 계산 (현재 주의 월요일~일요일)
        v_period_start := date_trunc('week', NEW.created_at::DATE)::DATE;
        v_period_end := (date_trunc('week', NEW.created_at::DATE) + INTERVAL '6 days')::DATE;
        
        -- Settlement 레코드 생성 또는 업데이트 (정산 예정)
        INSERT INTO settlements (
            store_id,
            period_start,
            period_end,
            total_orders,
            total_amount,
            commission_rate,
            commission_amount,
            net_amount,
            order_ids,
            status,
            metadata
        ) VALUES (
            v_store_id,
            v_period_start,
            v_period_end,
            1,
            v_order_amount,
            v_commission_rate,
            v_commission_amount,
            v_net_amount,
            ARRAY[NEW.id],
            'pending',  -- 정산 대기 상태
            jsonb_build_object(
                'type', 'weekly_settlement',
                'settlement_date', v_period_end + INTERVAL '5 days'  -- 다음주 금요일
            )
        )
        ON CONFLICT (store_id, period_start, period_end) 
        DO UPDATE SET
            total_orders = settlements.total_orders + 1,
            total_amount = settlements.total_amount + v_order_amount,
            commission_amount = settlements.commission_amount + v_commission_amount,
            net_amount = settlements.net_amount + v_net_amount,
            order_ids = array_append(settlements.order_ids, NEW.id),
            updated_at = NOW()
        RETURNING id INTO v_settlement_id;
        
        -- Settlement items 추가 (정산 상세)
        INSERT INTO settlement_items (
            settlement_id,
            order_id,
            order_number,
            order_date,
            product_name,
            quantity,
            original_amount,
            commission_rate,
            commission_amount,
            net_amount
        ) VALUES (
            v_settlement_id,
            NEW.id,
            NEW.order_number,
            NEW.created_at,
            NEW.product->>'name',
            COALESCE((NEW.product->>'quantity')::INTEGER, 1),
            v_order_amount,
            v_commission_rate,
            v_commission_amount,
            v_net_amount
        )
        ON CONFLICT (settlement_id, order_id) DO NOTHING;
        
        RAISE NOTICE 'Order % completed. Settlement scheduled for store % (amount: % won)', 
            NEW.order_number, v_store_id, v_net_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER trigger_record_order_completion
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION record_order_completion_for_settlement();

-- 2. 매주 금요일 실제 정산 처리 (포인트 지급)
CREATE OR REPLACE FUNCTION execute_weekly_settlements()
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
    v_processed_count INTEGER := 0;
    v_total_amount INTEGER := 0;
    v_current_balance INTEGER;
    v_last_friday DATE;
BEGIN
    -- 지난주 금요일 계산
    v_last_friday := CURRENT_DATE - INTERVAL '1 week' + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER;
    
    -- 지난주까지의 pending 정산들 처리
    FOR v_settlement IN 
        SELECT * FROM settlements 
        WHERE status = 'pending'
        AND period_end <= v_last_friday
        AND store_id IS NOT NULL
        ORDER BY store_id, period_start
    LOOP
        -- 1. 수주화원에게 실제 포인트 지급
        UPDATE stores 
        SET 
            points_balance = points_balance + v_settlement.net_amount,
            total_sales = total_sales + v_settlement.total_amount
        WHERE id = v_settlement.store_id
        RETURNING points_balance INTO v_current_balance;
        
        -- 2. 포인트 거래 내역 기록
        INSERT INTO point_transactions (
            store_id,
            type,
            amount,
            balance_before,
            balance_after,
            settlement_id,
            description
        ) VALUES (
            v_settlement.store_id,
            'income',
            v_settlement.net_amount,
            v_current_balance - v_settlement.net_amount,
            v_current_balance,
            v_settlement.id,
            '주간 정산 (' || v_settlement.period_start || ' ~ ' || v_settlement.period_end || 
            ', 주문 ' || v_settlement.total_orders || '건, 수수료 20% 차감)'
        );
        
        -- 3. 정산 상태 업데이트
        UPDATE settlements SET
            status = 'completed',  -- 또는 'processing' (실제 송금 전)
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_settlement.id;
        
        -- 4. 정산 이력 추가
        INSERT INTO settlement_history (
            settlement_id,
            action,
            previous_status,
            new_status,
            details
        ) VALUES (
            v_settlement.id,
            'weekly_settlement_executed',
            'pending',
            'completed',
            jsonb_build_object(
                'settlement_date', NOW(),
                'settlement_amount', v_settlement.net_amount,
                'commission_amount', v_settlement.commission_amount,
                'total_orders', v_settlement.total_orders
            )
        );
        
        v_processed_count := v_processed_count + 1;
        v_total_amount := v_total_amount + v_settlement.net_amount;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'total_settled_amount', v_total_amount,
        'settlement_date', NOW(),
        'message', v_processed_count || '건의 정산이 완료되었습니다. 총 ' || v_total_amount || '원 지급'
    );
END;
$$ LANGUAGE plpgsql;

-- 3. 정산 예정 금액 조회 함수
CREATE OR REPLACE FUNCTION get_pending_settlement_amount(p_store_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_pending_amount INTEGER;
BEGIN
    SELECT COALESCE(SUM(net_amount), 0) INTO v_pending_amount
    FROM settlements
    WHERE store_id = p_store_id
    AND status = 'pending';
    
    RETURN v_pending_amount;
END;
$$ LANGUAGE plpgsql;

-- 4. 가맹점용 정산 현황 뷰 (정산 예정 금액 포함)
CREATE OR REPLACE VIEW v_store_settlement_status AS
SELECT 
    s.id as store_id,
    s.business_name,
    s.points_balance as current_balance,
    COALESCE(pending.pending_amount, 0) as pending_settlement_amount,
    COALESCE(pending.pending_orders, 0) as pending_orders,
    COALESCE(pending.next_settlement_date, NULL) as next_settlement_date,
    s.points_balance + COALESCE(pending.pending_amount, 0) as expected_balance
FROM stores s
LEFT JOIN (
    SELECT 
        store_id,
        SUM(net_amount) as pending_amount,
        SUM(total_orders) as pending_orders,
        MIN(period_end + INTERVAL '5 days') as next_settlement_date
    FROM settlements
    WHERE status = 'pending'
    GROUP BY store_id
) pending ON s.id = pending.store_id;

-- 5. 권한 부여
GRANT EXECUTE ON FUNCTION record_order_completion_for_settlement TO authenticated;
GRANT EXECUTE ON FUNCTION execute_weekly_settlements TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_settlement_amount TO authenticated;
GRANT SELECT ON v_store_settlement_status TO authenticated;

-- 6. 테스트 쿼리
-- 정산 예정 확인
SELECT 
    store_id,
    SUM(net_amount) as pending_amount,
    COUNT(*) as settlement_count,
    MIN(period_start) as from_date,
    MAX(period_end) as to_date
FROM settlements
WHERE status = 'pending'
GROUP BY store_id;

-- 가맹점별 현황
SELECT * FROM v_store_settlement_status;
