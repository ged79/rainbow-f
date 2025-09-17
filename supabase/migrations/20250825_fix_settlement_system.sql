-- =============================================
-- 정산 시스템 재구축 (2025-08-25)
-- 수주화원 배송 완료 시 정산 처리
-- =============================================

-- 1. 주문 완료 시 포인트 지급 및 정산 레코드 생성 함수
CREATE OR REPLACE FUNCTION process_order_completion()
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
    v_current_balance INTEGER;
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
        
        -- 1. 수주화원에게 포인트 지급 (수수료 차감 후)
        UPDATE stores 
        SET 
            points_balance = points_balance + v_net_amount,
            total_orders_received = total_orders_received + 1,
            total_sales = total_sales + v_order_amount
        WHERE id = v_store_id
        RETURNING points_balance INTO v_current_balance;
        
        -- 2. 포인트 거래 내역 기록
        INSERT INTO point_transactions (
            store_id,
            type,
            amount,
            balance_before,
            balance_after,
            order_id,
            description
        ) VALUES (
            v_store_id,
            'income',
            v_net_amount,
            v_current_balance - v_net_amount,
            v_current_balance,
            NEW.id,
            '주문 수익 (수수료 ' || v_commission_rate || '% 차감)'
        );
        
        -- 3. 정산 기간 계산 (현재 주의 월요일~일요일)
        v_period_start := date_trunc('week', NOW())::DATE;
        v_period_end := (date_trunc('week', NOW()) + INTERVAL '6 days')::DATE;
        
        -- 4. Settlement 레코드 생성 또는 업데이트
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
            status
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
            'pending'
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
        
        -- 5. Settlement items 추가
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
        
        RAISE NOTICE 'Order % completed. Store % received % points (commission: %)', 
            NEW.order_number, v_store_id, v_net_amount, v_commission_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성 (기존 트리거 삭제 후 재생성)
DROP TRIGGER IF EXISTS trigger_process_order_completion ON orders;
CREATE TRIGGER trigger_process_order_completion
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_order_completion();

-- 3. 매주 금요일 정산 처리 함수
CREATE OR REPLACE FUNCTION process_weekly_settlements()
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
    v_processed_count INTEGER := 0;
    v_total_amount INTEGER := 0;
    v_friday DATE;
BEGIN
    -- 지난주 금요일 계산
    v_friday := CURRENT_DATE - INTERVAL '1 week' + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER;
    
    -- 지난주 완료된 pending 상태의 정산들 처리
    FOR v_settlement IN 
        SELECT * FROM settlements 
        WHERE status = 'pending'
        AND period_end < v_friday
    LOOP
        -- 정산 상태를 processing으로 변경
        UPDATE settlements SET
            status = 'processing',
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_settlement.id;
        
        v_processed_count := v_processed_count + 1;
        v_total_amount := v_total_amount + v_settlement.net_amount;
        
        -- 정산 이력 추가
        INSERT INTO settlement_history (
            settlement_id,
            action,
            previous_status,
            new_status,
            details
        ) VALUES (
            v_settlement.id,
            'weekly_processing',
            'pending',
            'processing',
            jsonb_build_object(
                'processed_date', NOW(),
                'settlement_amount', v_settlement.net_amount
            )
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'total_amount', v_total_amount,
        'message', v_processed_count || '건의 정산이 처리되었습니다'
    );
END;
$$ LANGUAGE plpgsql;

-- 4. 기존 완료된 주문들에 대한 정산 마이그레이션 (한 번만 실행)
DO $$
DECLARE
    v_order RECORD;
    v_count INTEGER := 0;
BEGIN
    -- 모든 completed 상태 주문 중 정산되지 않은 건들 처리
    FOR v_order IN 
        SELECT o.* 
        FROM orders o
        LEFT JOIN point_transactions pt ON pt.order_id = o.id AND pt.type = 'income'
        WHERE o.status = 'completed'
        AND o.receiver_store_id IS NOT NULL
        AND pt.id IS NULL  -- 아직 정산되지 않은 주문만
        ORDER BY o.created_at
    LOOP
        -- 상태를 pending으로 바꿨다가 다시 completed로 변경하여 트리거 발동
        UPDATE orders SET status = 'pending' WHERE id = v_order.id;
        UPDATE orders SET status = 'completed' WHERE id = v_order.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE '% 건의 기존 주문을 정산 처리했습니다', v_count;
END $$;

-- 5. 권한 부여
GRANT EXECUTE ON FUNCTION process_order_completion TO authenticated;
GRANT EXECUTE ON FUNCTION process_weekly_settlements TO authenticated;

-- 6. 정산 현황 확인 뷰
CREATE OR REPLACE VIEW v_settlement_status AS
SELECT 
    s.id,
    s.store_id,
    st.business_name,
    s.period_start,
    s.period_end,
    s.total_orders,
    s.total_amount,
    s.commission_amount,
    s.net_amount,
    s.status,
    s.processed_at,
    CASE 
        WHEN s.status = 'pending' AND s.period_end < CURRENT_DATE - INTERVAL '1 week' + (5 - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
        THEN '정산 대기 (이번 주 금요일 처리 예정)'
        WHEN s.status = 'pending'
        THEN '집계 중'
        WHEN s.status = 'processing'
        THEN '송금 대기'
        WHEN s.status = 'completed'
        THEN '정산 완료'
        ELSE s.status
    END as status_display
FROM settlements s
JOIN stores st ON s.store_id = st.id
ORDER BY s.period_start DESC, st.business_name;

-- 권한 부여
GRANT SELECT ON v_settlement_status TO authenticated;

-- 7. 확인 쿼리
SELECT 
    'Settlements' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM settlements;
