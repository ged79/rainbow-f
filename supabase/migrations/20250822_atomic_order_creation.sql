-- Create atomic order creation function
CREATE OR REPLACE FUNCTION create_order_with_payment(
    p_order_data JSONB,
    p_sender_store_id UUID,
    p_total_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_current_balance INTEGER;
    v_order_number VARCHAR(20);
BEGIN
    -- Start transaction block
    -- Get current balance with lock
    SELECT points_balance INTO v_current_balance
    FROM stores
    WHERE id = p_sender_store_id
    FOR UPDATE;
    
    IF v_current_balance < p_total_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient points balance'
        );
    END IF;
    
    -- Generate order number
    v_order_number := TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Create order
    INSERT INTO orders (
        order_number,
        sender_store_id,
        receiver_store_id,
        type,
        customer,
        recipient,
        product,
        payment,
        status,
        pending_until
    ) VALUES (
        v_order_number,
        p_sender_store_id,
        (p_order_data->>'receiver_store_id')::UUID,
        'send',
        p_order_data->'customer',
        p_order_data->'recipient',
        p_order_data->'product',
        p_order_data->'payment',
        'pending',
        NOW() + INTERVAL '30 minutes'
    ) RETURNING id INTO v_order_id;
    
    -- Deduct points
    UPDATE stores 
    SET points_balance = points_balance - p_total_amount,
        total_orders_sent = total_orders_sent + 1
    WHERE id = p_sender_store_id;
    
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
        p_sender_store_id,
        'payment',
        -p_total_amount,
        v_current_balance,
        v_current_balance - p_total_amount,
        v_order_id,
        'Order payment'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Automatic rollback on any error
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;