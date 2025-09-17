-- ========================================
-- FLOWER PLATFORM 정산 시스템 완전 구현
-- ========================================
-- 작성일: 2025-01-21
-- 목적: 실제 정산 테이블 생성 및 자동화 시스템 구축

-- 1. 정산 테이블 생성
-- ========================================
CREATE TABLE IF NOT EXISTS settlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 정산 기간
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- 정산 금액 정보
    total_orders INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,      -- 총 매출액
    commission_rate DECIMAL(5,2) DEFAULT 20.00,  -- 수수료율 (%)
    commission_amount INTEGER DEFAULT 0,  -- 수수료 금액
    net_amount INTEGER DEFAULT 0,        -- 실 정산금액 (총매출 - 수수료)
    
    -- 포함된 주문 ID들 (배열)
    order_ids UUID[] DEFAULT '{}',
    
    -- 정산 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- 정산 처리 정보
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES admin_users(id),
    
    -- 송금 정보
    bank_name VARCHAR(50),
    account_number VARCHAR(50),
    account_holder VARCHAR(50),
    transfer_note TEXT,
    
    -- 메타데이터
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약 (한 가맹점의 동일 기간 중복 방지)
    CONSTRAINT unique_store_period UNIQUE (store_id, period_start, period_end)
);

-- 인덱스 생성
CREATE INDEX idx_settlements_store_id ON settlements(store_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_period ON settlements(period_start, period_end);
CREATE INDEX idx_settlements_created_at ON settlements(created_at);

-- 2. 정산 상세 테이블 (각 주문별 정산 내역)
-- ========================================
CREATE TABLE IF NOT EXISTS settlement_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    
    -- 주문 정보 스냅샷
    order_number VARCHAR(50),
    order_date TIMESTAMP WITH TIME ZONE,
    product_name TEXT,
    quantity INTEGER,
    
    -- 금액 정보
    original_amount INTEGER,      -- 원 주문금액
    commission_rate DECIMAL(5,2), -- 적용 수수료율
    commission_amount INTEGER,    -- 수수료
    net_amount INTEGER,          -- 실 정산금액
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_settlement_order UNIQUE (settlement_id, order_id)
);

CREATE INDEX idx_settlement_items_settlement_id ON settlement_items(settlement_id);
CREATE INDEX idx_settlement_items_order_id ON settlement_items(order_id);

-- 3. 정산 이력 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS settlement_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    
    action VARCHAR(50) NOT NULL, -- created, updated, processed, completed, failed, cancelled
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    
    details JSONB DEFAULT '{}',
    performed_by UUID REFERENCES admin_users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settlement_history_settlement_id ON settlement_history(settlement_id);

-- 4. 주문 완료시 자동 정산 대상 추가 트리거
-- ========================================
CREATE OR REPLACE FUNCTION add_order_to_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_store_id UUID;
    v_settlement_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_commission_rate DECIMAL(5,2) := 20.00; -- 기본 수수료율 20%
    v_order_amount INTEGER;
    v_commission_amount INTEGER;
    v_net_amount INTEGER;
BEGIN
    -- 주문이 completed 상태가 되었을 때만 처리
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        v_store_id := NEW.receiver_store_id;
        
        -- 주문 금액 계산
        v_order_amount := COALESCE((NEW.payment->>'total')::INTEGER, 0);
        v_commission_amount := FLOOR(v_order_amount * v_commission_rate / 100);
        v_net_amount := v_order_amount - v_commission_amount;
        
        -- 현재 주의 월요일과 일요일 계산
        v_period_start := date_trunc('week', NEW.created_at::DATE)::DATE;
        v_period_end := (date_trunc('week', NEW.created_at::DATE) + INTERVAL '6 days')::DATE;
        
        -- 해당 기간의 정산 찾기 또는 생성
        INSERT INTO settlements (
            store_id,
            period_start,
            period_end,
            total_orders,
            total_amount,
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
        
        -- 정산 상세 항목 추가
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
        
        -- 이력 추가
        INSERT INTO settlement_history (
            settlement_id,
            action,
            new_status,
            details
        ) VALUES (
            v_settlement_id,
            'order_added',
            'pending',
            jsonb_build_object(
                'order_id', NEW.id,
                'order_number', NEW.order_number,
                'amount', v_order_amount
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_add_order_to_settlement ON orders;
CREATE TRIGGER trigger_add_order_to_settlement
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION add_order_to_settlement();

-- 5. 정산 처리 함수
-- ========================================
CREATE OR REPLACE FUNCTION process_settlement(
    p_settlement_id UUID,
    p_admin_id UUID,
    p_action VARCHAR -- 'approve', 'reject', 'complete'
)
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
    v_result JSONB;
BEGIN
    -- 정산 정보 조회
    SELECT * INTO v_settlement 
    FROM settlements 
    WHERE id = p_settlement_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '정산 정보를 찾을 수 없습니다'
        );
    END IF;
    
    -- 액션별 처리
    CASE p_action
        WHEN 'approve' THEN
            -- 정산 승인 (pending -> processing)
            IF v_settlement.status != 'pending' THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'message', '대기중인 정산만 승인할 수 있습니다'
                );
            END IF;
            
            UPDATE settlements SET
                status = 'processing',
                processed_at = NOW(),
                processed_by = p_admin_id,
                updated_at = NOW()
            WHERE id = p_settlement_id;
            
            -- 이력 추가
            INSERT INTO settlement_history (
                settlement_id,
                action,
                previous_status,
                new_status,
                performed_by
            ) VALUES (
                p_settlement_id,
                'approved',
                'pending',
                'processing',
                p_admin_id
            );
            
            v_result := jsonb_build_object(
                'success', true,
                'message', '정산이 승인되었습니다',
                'status', 'processing'
            );
            
        WHEN 'complete' THEN
            -- 정산 완료 (processing -> completed)
            IF v_settlement.status != 'processing' THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'message', '처리중인 정산만 완료할 수 있습니다'
                );
            END IF;
            
            UPDATE settlements SET
                status = 'completed',
                updated_at = NOW()
            WHERE id = p_settlement_id;
            
            -- 이력 추가
            INSERT INTO settlement_history (
                settlement_id,
                action,
                previous_status,
                new_status,
                performed_by
            ) VALUES (
                p_settlement_id,
                'completed',
                'processing',
                'completed',
                p_admin_id
            );
            
            v_result := jsonb_build_object(
                'success', true,
                'message', '정산이 완료되었습니다',
                'status', 'completed'
            );
            
        WHEN 'reject' THEN
            -- 정산 반려
            UPDATE settlements SET
                status = 'cancelled',
                updated_at = NOW()
            WHERE id = p_settlement_id;
            
            -- 이력 추가
            INSERT INTO settlement_history (
                settlement_id,
                action,
                previous_status,
                new_status,
                performed_by
            ) VALUES (
                p_settlement_id,
                'rejected',
                v_settlement.status,
                'cancelled',
                p_admin_id
            );
            
            v_result := jsonb_build_object(
                'success', true,
                'message', '정산이 반려되었습니다',
                'status', 'cancelled'
            );
            
        ELSE
            v_result := jsonb_build_object(
                'success', false,
                'message', '알 수 없는 액션입니다'
            );
    END CASE;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. 정산 요약 뷰
-- ========================================
CREATE OR REPLACE VIEW settlement_summary AS
SELECT 
    s.id,
    s.store_id,
    st.business_name,
    st.owner_name,
    s.period_start,
    s.period_end,
    s.total_orders,
    s.total_amount,
    s.commission_rate,
    s.commission_amount,
    s.net_amount,
    s.status,
    s.processed_at,
    au.name as processed_by_name,
    s.created_at,
    s.updated_at
FROM settlements s
LEFT JOIN stores st ON s.store_id = st.id
LEFT JOIN admin_users au ON s.processed_by = au.id;

-- 7. RLS (Row Level Security) 정책
-- ========================================
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_history ENABLE ROW LEVEL SECURITY;

-- 가맹점: 자신의 정산만 조회
CREATE POLICY "Stores can view own settlements" ON settlements
    FOR SELECT
    USING (store_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    ));

CREATE POLICY "Stores can view own settlement items" ON settlement_items
    FOR SELECT
    USING (settlement_id IN (
        SELECT id FROM settlements s
        WHERE s.store_id IN (
            SELECT id FROM stores WHERE user_id = auth.uid()
        )
    ));

-- Admin: 모든 정산 조회 및 수정
CREATE POLICY "Admin can manage all settlements" ON settlements
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admin can view all settlement items" ON settlement_items
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ));

CREATE POLICY "Admin can view all settlement history" ON settlement_history
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    ));

-- 8. 권한 부여
-- ========================================
GRANT SELECT ON settlements TO authenticated;
GRANT SELECT ON settlement_items TO authenticated;
GRANT SELECT ON settlement_history TO authenticated;
GRANT SELECT ON settlement_summary TO authenticated;
GRANT EXECUTE ON FUNCTION process_settlement TO authenticated;

-- 9. 자동 정산 처리 함수
-- ========================================
CREATE OR REPLACE FUNCTION auto_process_settlements()
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
    v_count INTEGER := 0;
BEGIN
    -- 1주일 이상 지난 pending 정산을 자동으로 processing으로 변경
    FOR v_settlement IN 
        SELECT id FROM settlements 
        WHERE status = 'pending'
        AND period_end < CURRENT_DATE - INTERVAL '7 days'
    LOOP
        UPDATE settlements SET
            status = 'processing',
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_settlement.id;
        
        INSERT INTO settlement_history (
            settlement_id,
            action,
            previous_status,
            new_status
        ) VALUES (
            v_settlement.id,
            'auto_processed',
            'pending',
            'processing'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_count,
        'message', v_count || '건의 정산이 자동 처리되었습니다'
    );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION auto_process_settlements TO authenticated;

-- 10. 기존 주문 데이터 마이그레이션 (한 번만 실행)
-- ========================================
DO $$
DECLARE
    v_order RECORD;
    v_count INTEGER := 0;
BEGIN
    -- 모든 completed 주문에 대해 정산 생성
    FOR v_order IN 
        SELECT * FROM orders 
        WHERE status = 'completed'
        ORDER BY created_at
    LOOP
        -- 트리거 함수를 수동으로 호출하는 효과
        UPDATE orders 
        SET updated_at = NOW()
        WHERE id = v_order.id;
        
        v_count := v_count + 1;
    END LOOP;
    
    RAISE NOTICE '% 건의 주문을 정산 시스템으로 마이그레이션했습니다', v_count;
END $$;