-- =============================================
-- Settlement Duplicate Fix Migration
-- Date: 2025-01-08
-- Purpose: Fix duplicate order_ids in settlements array
-- =============================================

-- STEP 1: Clean existing duplicate data in settlements
-- =============================================
-- Remove duplicates from order_ids array in all settlements
UPDATE settlements
SET 
    order_ids = (
        SELECT array_agg(DISTINCT unnest_ids) 
        FROM unnest(order_ids) as unnest_ids
    ),
    -- Update total_orders to match actual unique count
    total_orders = (
        SELECT COUNT(DISTINCT unnest_ids) 
        FROM unnest(order_ids) as unnest_ids
    ),
    updated_at = NOW()
WHERE array_length(order_ids, 1) != (
    SELECT COUNT(DISTINCT unnest_ids) 
    FROM unnest(order_ids) as unnest_ids
);

-- Log how many settlements were fixed
DO $$
DECLARE
    v_fixed_count INTEGER;
BEGIN
    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    IF v_fixed_count > 0 THEN
        RAISE NOTICE 'Fixed % settlements with duplicate order_ids', v_fixed_count;
    END IF;
END $$;

-- STEP 2: Fix mismatched counts between total_orders and array_length
-- =============================================
UPDATE settlements
SET 
    total_orders = COALESCE(array_length(order_ids, 1), 0),
    updated_at = NOW()
WHERE total_orders != COALESCE(array_length(order_ids, 1), 0);

-- STEP 3: Drop all existing settlement triggers to start fresh
-- =============================================
DROP TRIGGER IF EXISTS trigger_record_order_completion ON orders;
DROP TRIGGER IF EXISTS trigger_add_order_to_settlement ON orders;
DROP TRIGGER IF EXISTS trigger_process_order_completion ON orders;
DROP TRIGGER IF EXISTS on_order_complete_settlement ON orders;

-- Drop all existing settlement functions
DROP FUNCTION IF EXISTS record_order_completion_for_settlement() CASCADE;
DROP FUNCTION IF EXISTS add_order_to_settlement() CASCADE;
DROP FUNCTION IF EXISTS process_order_completion() CASCADE;

-- STEP 4: Create improved settlement trigger function with duplicate prevention
-- =============================================
CREATE OR REPLACE FUNCTION process_order_settlement()
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
    v_already_exists BOOLEAN;
BEGIN
    -- Only process when order becomes 'completed'
    IF NEW.status = 'completed' AND 
       (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        -- Get receiver store
        v_store_id := NEW.receiver_store_id;
        
        -- Skip if no receiver store (본사 배정 대기)
        IF v_store_id IS NULL THEN
            RAISE NOTICE 'Order % has no receiver store yet', NEW.id;
            RETURN NEW;
        END IF;
        
        -- Calculate amounts
        v_order_amount := COALESCE((NEW.payment->>'total')::INTEGER, 0);
        v_commission_amount := FLOOR(v_order_amount * v_commission_rate / 100);
        v_net_amount := v_order_amount - v_commission_amount;
        
        -- Calculate settlement period (Monday to Sunday)
        v_period_start := date_trunc('week', NEW.created_at::DATE)::DATE;
        v_period_end := (date_trunc('week', NEW.created_at::DATE) + INTERVAL '6 days')::DATE;
        
        -- Check if order already exists in any settlement for this store/period
        SELECT EXISTS(
            SELECT 1 FROM settlements 
            WHERE store_id = v_store_id 
            AND period_start = v_period_start 
            AND period_end = v_period_end
            AND NEW.id = ANY(order_ids)
        ) INTO v_already_exists;
        
        IF v_already_exists THEN
            RAISE NOTICE 'Order % already in settlement for store % period %-%', 
                NEW.id, v_store_id, v_period_start, v_period_end;
            RETURN NEW;
        END IF;
        
        -- Insert or update settlement (with duplicate prevention)
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
            'pending',
            jsonb_build_object(
                'type', 'weekly_settlement',
                'settlement_date', v_period_end + INTERVAL '5 days',
                'created_at', NOW()
            )
        )
        ON CONFLICT (store_id, period_start, period_end) 
        DO UPDATE SET
            -- Only update if order_id is not already in array
            total_orders = CASE 
                WHEN NEW.id = ANY(settlements.order_ids) THEN settlements.total_orders
                ELSE settlements.total_orders + 1
            END,
            total_amount = CASE 
                WHEN NEW.id = ANY(settlements.order_ids) THEN settlements.total_amount
                ELSE settlements.total_amount + v_order_amount
            END,
            commission_amount = CASE 
                WHEN NEW.id = ANY(settlements.order_ids) THEN settlements.commission_amount
                ELSE settlements.commission_amount + v_commission_amount
            END,
            net_amount = CASE 
                WHEN NEW.id = ANY(settlements.order_ids) THEN settlements.net_amount
                ELSE settlements.net_amount + v_net_amount
            END,
            order_ids = CASE 
                WHEN NEW.id = ANY(settlements.order_ids) THEN settlements.order_ids
                ELSE array_append(settlements.order_ids, NEW.id)
            END,
            updated_at = NOW()
        RETURNING id INTO v_settlement_id;
        
        -- Add to settlement_items (with duplicate prevention)
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
        ON CONFLICT (settlement_id, order_id) 
        DO UPDATE SET
            -- Update amounts if they changed (shouldn't happen but safety check)
            original_amount = EXCLUDED.original_amount,
            commission_amount = EXCLUDED.commission_amount,
            net_amount = EXCLUDED.net_amount;
        
        RAISE NOTICE 'Order % added to settlement % for store % (amount: %)', 
            NEW.order_number, v_settlement_id, v_store_id, v_net_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Create single trigger for order settlement
-- =============================================
CREATE TRIGGER trigger_process_order_settlement
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION process_order_settlement();

-- STEP 6: Create function to recalculate settlement totals from items
-- =============================================
CREATE OR REPLACE FUNCTION recalculate_settlement_totals(p_settlement_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_settlement RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    -- If specific settlement_id provided, recalculate only that one
    IF p_settlement_id IS NOT NULL THEN
        UPDATE settlements s
        SET 
            total_orders = COALESCE(sub.item_count, 0),
            total_amount = COALESCE(sub.total_original, 0),
            commission_amount = COALESCE(sub.total_commission, 0),
            net_amount = COALESCE(sub.total_net, 0),
            updated_at = NOW()
        FROM (
            SELECT 
                settlement_id,
                COUNT(*) as item_count,
                SUM(original_amount) as total_original,
                SUM(commission_amount) as total_commission,
                SUM(net_amount) as total_net
            FROM settlement_items
            WHERE settlement_id = p_settlement_id
            GROUP BY settlement_id
        ) sub
        WHERE s.id = sub.settlement_id
        AND s.id = p_settlement_id;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    ELSE
        -- Recalculate all settlements
        UPDATE settlements s
        SET 
            total_orders = COALESCE(sub.item_count, 0),
            total_amount = COALESCE(sub.total_original, 0),
            commission_amount = COALESCE(sub.total_commission, 0),
            net_amount = COALESCE(sub.total_net, 0),
            updated_at = NOW()
        FROM (
            SELECT 
                settlement_id,
                COUNT(*) as item_count,
                SUM(original_amount) as total_original,
                SUM(commission_amount) as total_commission,
                SUM(net_amount) as total_net
            FROM settlement_items
            GROUP BY settlement_id
        ) sub
        WHERE s.id = sub.settlement_id;
        
        GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'updated_count', v_updated_count,
        'message', format('Updated %s settlement(s)', v_updated_count)
    );
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Create verification function
-- =============================================
CREATE OR REPLACE FUNCTION verify_settlement_integrity()
RETURNS TABLE (
    settlement_id UUID,
    store_name TEXT,
    period TEXT,
    issue_type TEXT,
    expected_value BIGINT,
    actual_value BIGINT,
    difference BIGINT
) AS $$
BEGIN
    -- Check for count mismatches
    RETURN QUERY
    SELECT 
        s.id,
        st.business_name::TEXT,
        (s.period_start || ' to ' || s.period_end)::TEXT,
        'Order Count Mismatch'::TEXT,
        COALESCE(array_length(s.order_ids, 1), 0)::BIGINT as expected_value,
        s.total_orders::BIGINT as actual_value,
        (s.total_orders - COALESCE(array_length(s.order_ids, 1), 0))::BIGINT as difference
    FROM settlements s
    LEFT JOIN stores st ON st.id = s.store_id
    WHERE s.total_orders != COALESCE(array_length(s.order_ids, 1), 0);
    
    -- Check for duplicates in order_ids array
    RETURN QUERY
    SELECT 
        s.id,
        st.business_name::TEXT,
        (s.period_start || ' to ' || s.period_end)::TEXT,
        'Duplicate Orders in Array'::TEXT,
        COUNT(DISTINCT unnest_ids)::BIGINT as expected_value,
        array_length(s.order_ids, 1)::BIGINT as actual_value,
        (array_length(s.order_ids, 1) - COUNT(DISTINCT unnest_ids))::BIGINT as difference
    FROM settlements s
    LEFT JOIN stores st ON st.id = s.store_id
    CROSS JOIN LATERAL unnest(s.order_ids) as unnest_ids
    GROUP BY s.id, st.business_name, s.period_start, s.period_end, s.order_ids
    HAVING array_length(s.order_ids, 1) != COUNT(DISTINCT unnest_ids);
    
    -- Check for settlement_items count mismatch
    RETURN QUERY
    SELECT 
        s.id,
        st.business_name::TEXT,
        (s.period_start || ' to ' || s.period_end)::TEXT,
        'Settlement Items Count Mismatch'::TEXT,
        s.total_orders::BIGINT as expected_value,
        COUNT(si.id)::BIGINT as actual_value,
        (s.total_orders - COUNT(si.id))::BIGINT as difference
    FROM settlements s
    LEFT JOIN stores st ON st.id = s.store_id
    LEFT JOIN settlement_items si ON si.settlement_id = s.id
    GROUP BY s.id, st.business_name, s.period_start, s.period_end, s.total_orders
    HAVING s.total_orders != COUNT(si.id);
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Run verification
-- =============================================
SELECT * FROM verify_settlement_integrity();

-- STEP 9: Grant permissions
-- =============================================
GRANT EXECUTE ON FUNCTION recalculate_settlement_totals TO authenticated;
GRANT EXECUTE ON FUNCTION verify_settlement_integrity TO authenticated;

-- STEP 10: Add helpful indexes if not exists
-- =============================================
CREATE INDEX IF NOT EXISTS idx_settlements_order_ids ON settlements USING GIN(order_ids);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);

-- Final message
DO $$
DECLARE
    v_issue_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_issue_count FROM verify_settlement_integrity();
    
    IF v_issue_count = 0 THEN
        RAISE NOTICE '✅ All settlements are now consistent!';
    ELSE
        RAISE WARNING '⚠️ Found % integrity issues. Run SELECT * FROM verify_settlement_integrity(); to see details', v_issue_count;
    END IF;
END $$;