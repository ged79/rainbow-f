-- COMPLETE TRIGGER CLEANUP
-- Remove ALL settlement-related triggers to start fresh

-- 1. Drop all settlement triggers
DROP TRIGGER IF EXISTS on_order_complete ON orders CASCADE;
DROP TRIGGER IF EXISTS on_order_completed ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_create_pending_settlement ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_process_order_settlement ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_record_order_completion ON orders CASCADE;

-- 2. Drop all settlement functions
DROP FUNCTION IF EXISTS create_pending_settlement() CASCADE;
DROP FUNCTION IF EXISTS process_order_settlement() CASCADE;
DROP FUNCTION IF EXISTS record_order_completion_for_settlement() CASCADE;
DROP FUNCTION IF EXISTS handle_order_complete() CASCADE;
DROP FUNCTION IF EXISTS handle_order_completed() CASCADE;

-- 3. Create SINGLE correct function
CREATE OR REPLACE FUNCTION handle_order_settlement()
RETURNS TRIGGER AS $$
DECLARE
    v_store_id UUID;
    v_period_start DATE;
    v_period_end DATE;
    v_order_amount INTEGER;
    v_commission_amount INTEGER;
    v_net_amount INTEGER;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        v_store_id := NEW.receiver_store_id;
        
        IF v_store_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        v_order_amount := COALESCE((NEW.payment->>'total')::INTEGER, 0);
        v_commission_amount := FLOOR(v_order_amount * 0.25); -- 25% commission
        v_net_amount := v_order_amount - v_commission_amount;
        
        v_period_start := date_trunc('week', COALESCE(NEW.created_at, NOW())::DATE)::DATE;
        v_period_end := (v_period_start + INTERVAL '6 days')::DATE;
        
        INSERT INTO settlements (
            store_id, period_start, period_end, total_orders,
            total_amount, commission_rate, commission_amount,
            net_amount, settlement_amount, order_ids, status
        ) VALUES (
            v_store_id, v_period_start, v_period_end, 1,
            v_order_amount, 25.00, v_commission_amount,
            v_net_amount, v_net_amount, ARRAY[NEW.id], 'pending'
        )
        ON CONFLICT (store_id, period_start, period_end) 
        DO UPDATE SET
            total_orders = settlements.total_orders + 1,
            total_amount = settlements.total_amount + v_order_amount,
            commission_amount = settlements.commission_amount + v_commission_amount,
            net_amount = settlements.net_amount + v_net_amount,
            settlement_amount = settlements.settlement_amount + v_net_amount,
            order_ids = array_append(settlements.order_ids, NEW.id),
            updated_at = NOW()
        WHERE NOT (NEW.id = ANY(settlements.order_ids));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create SINGLE trigger
CREATE TRIGGER trigger_handle_order_settlement
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_settlement();

-- 5. Verify cleanup
SELECT 'Settlement triggers after cleanup:' as status;
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'orders'::regclass 
AND NOT tgisinternal
AND tgname LIKE '%settlement%' OR tgname LIKE '%complet%';
