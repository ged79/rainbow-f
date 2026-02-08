-- =============================================
-- Order Edit Points Handling Fix
-- Date: 2025-01-08
-- Purpose: Handle points adjustment when orders are edited
-- =============================================

-- Create function to handle order updates with points adjustment
CREATE OR REPLACE FUNCTION handle_order_edit(
    p_order_id UUID,
    p_store_id UUID,
    p_original_amount INTEGER,
    p_new_amount INTEGER,
    p_order_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_difference INTEGER;
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_type point_transaction_type;
    v_description TEXT;
BEGIN
    -- Calculate difference
    v_difference := p_new_amount - p_original_amount;
    
    -- Get current balance with lock
    SELECT points_balance INTO v_current_balance
    FROM stores
    WHERE id = p_store_id
    FOR UPDATE;
    
    -- Check if store has enough points for increase
    IF v_difference > 0 AND v_current_balance < v_difference THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient points for order modification',
            'required', v_difference,
            'available', v_current_balance
        );
    END IF;
    
    -- Update order
    UPDATE orders
    SET 
        customer = COALESCE(p_order_data->'customer', customer),
        recipient = COALESCE(p_order_data->'recipient', recipient),
        product = COALESCE(p_order_data->'product', product),
        payment = jsonb_build_object(
            'total', p_new_amount,
            'original_total', p_original_amount,
            'modified_at', NOW(),
            'difference', v_difference
        ),
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Handle points adjustment if there's a difference
    IF v_difference != 0 THEN
        -- Update store balance
        v_new_balance := v_current_balance - v_difference;
        
        UPDATE stores
        SET points_balance = v_new_balance
        WHERE id = p_store_id;
        
        -- Determine transaction type and description
        IF v_difference > 0 THEN
            v_transaction_type := 'payment'::point_transaction_type;
            v_description := 'Order modification - additional charge';
        ELSE
            v_transaction_type := 'refund'::point_transaction_type;
            v_description := 'Order modification - partial refund';
        END IF;
        
        -- Record transaction
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
            v_transaction_type,
            -v_difference,  -- Negative for charges, positive for refunds
            v_current_balance,
            v_new_balance,
            p_order_id,
            v_description || ' (' || ABS(v_difference) || '원)'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'original_amount', p_original_amount,
        'new_amount', p_new_amount,
        'difference', v_difference,
        'points_adjusted', v_difference != 0,
        'new_balance', COALESCE(v_new_balance, v_current_balance)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION handle_order_edit TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_order_id ON point_transactions(order_id);
