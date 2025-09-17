-- Add to the same migration file or create separate one
-- Function to handle order cancellation/deletion with refund
CREATE OR REPLACE FUNCTION refund_order_points(
    p_order_id UUID,
    p_store_id UUID,
    p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT points_balance INTO v_current_balance
    FROM stores
    WHERE id = p_store_id;
    
    -- Update balance
    UPDATE stores
    SET points_balance = points_balance + p_amount
    WHERE id = p_store_id;
    
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
        p_store_id,
        'refund'::point_transaction_type,
        p_amount,
        v_current_balance,
        v_current_balance + p_amount,
        p_order_id,
        'Order cancellation refund'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'refunded', p_amount,
        'new_balance', v_current_balance + p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refund_order_points TO authenticated;