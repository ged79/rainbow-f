-- 30-minute auto rejection system
CREATE OR REPLACE FUNCTION auto_reject_expired_orders()
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
    v_order RECORD;
    v_balance INTEGER;
BEGIN
    -- Find and reject expired pending orders
    FOR v_order IN 
        SELECT id, order_number, sender_store_id, payment
        FROM orders 
        WHERE status = 'pending'
        AND pending_until IS NOT NULL
        AND pending_until < NOW()
    LOOP
        -- Update order status
        UPDATE orders 
        SET status = 'rejected',
            updated_at = NOW()
        WHERE id = v_order.id;
        
        -- Refund points to sender
        UPDATE stores 
        SET points_balance = points_balance + (v_order.payment->>'total')::INTEGER
        WHERE id = v_order.sender_store_id
        RETURNING points_balance INTO v_balance;
        
        -- Record refund transaction
        INSERT INTO point_transactions (
            store_id,
            type,
            amount,
            balance_before,
            balance_after,
            order_id,
            description
        ) VALUES (
            v_order.sender_store_id,
            'refund',
            (v_order.payment->>'total')::INTEGER,
            v_balance - (v_order.payment->>'total')::INTEGER,
            v_balance,
            v_order.id,
            '30분 자동 거절 환불'
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'rejected_count', v_count,
        'message', v_count || '건의 주문이 자동 거절되었습니다'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_reject_expired_orders TO service_role;
GRANT EXECUTE ON FUNCTION auto_reject_expired_orders TO authenticated;