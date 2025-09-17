-- 정산 테이블 제약조건 확인 및 수정
-- 트리거는 유지하되 문제 해결

-- 1. 기존 제약조건 확인
SELECT conname, contype, conrelid::regclass 
FROM pg_constraint 
WHERE conrelid = 'settlements'::regclass;

-- 2. unique_store_period 제약조건이 없으면 생성
DO $$
BEGIN
    -- 제약조건이 이미 있는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_store_period'
        AND conrelid = 'settlements'::regclass
    ) THEN
        -- 테이블이 존재하는지 확인
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'settlements'
        ) THEN
            ALTER TABLE settlements 
            ADD CONSTRAINT unique_store_period 
            UNIQUE (store_id, period_start, period_end);
            RAISE NOTICE 'unique_store_period constraint added';
        ELSE
            RAISE NOTICE 'settlements table does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'unique_store_period constraint already exists';
    END IF;
END $$;

-- 3. 트리거 함수 수정 - ON CONFLICT 처리 개선
CREATE OR REPLACE FUNCTION add_order_to_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_store_id UUID;
    v_settlement_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_commission_rate DECIMAL(5,2) := 20.00;
    v_order_amount INTEGER;
    v_commission_amount INTEGER;
    v_net_amount INTEGER;
BEGIN
    -- 주문이 completed 상태가 되었을 때만 처리
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- receiver_store_id가 NULL인 경우 처리 안 함
        IF NEW.receiver_store_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        v_store_id := NEW.receiver_store_id;
        
        -- 주문 금액 계산
        v_order_amount := COALESCE((NEW.payment->>'total')::INTEGER, 0);
        v_commission_amount := FLOOR(v_order_amount * v_commission_rate / 100);
        v_net_amount := v_order_amount - v_commission_amount;
        
        -- 현재 주의 월요일과 일요일 계산
        v_period_start := date_trunc('week', COALESCE(NEW.created_at, NOW())::DATE)::DATE;
        v_period_end := (date_trunc('week', COALESCE(NEW.created_at, NOW())::DATE) + INTERVAL '6 days')::DATE;
        
        -- 먼저 기존 정산이 있는지 확인
        SELECT id INTO v_settlement_id
        FROM settlements
        WHERE store_id = v_store_id
        AND period_start = v_period_start
        AND period_end = v_period_end;
        
        IF v_settlement_id IS NULL THEN
            -- 새로 생성
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
            RETURNING id INTO v_settlement_id;
        ELSE
            -- 기존 정산에 추가
            UPDATE settlements SET
                total_orders = total_orders + 1,
                total_amount = total_amount + v_order_amount,
                commission_amount = commission_amount + v_commission_amount,
                net_amount = net_amount + v_net_amount,
                order_ids = array_append(order_ids, NEW.id),
                updated_at = NOW()
            WHERE id = v_settlement_id;
        END IF;
        
        -- 정산 상세 항목 추가 (중복 무시)
        BEGIN
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
            );
        EXCEPTION WHEN unique_violation THEN
            -- 이미 존재하면 무시
            NULL;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 재생성
DROP TRIGGER IF EXISTS trigger_add_order_to_settlement ON orders;
CREATE TRIGGER trigger_add_order_to_settlement
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION add_order_to_settlement();