-- Create the RPC function for atomic order creation with payment
CREATE OR REPLACE FUNCTION public.create_order_with_payment(
  p_order_data jsonb,
  p_sender_store_id uuid,
  p_total_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_current_balance integer;
  v_commission integer;
  v_receiver_store_id uuid;
BEGIN
  -- Check store balance
  SELECT points_balance INTO v_current_balance
  FROM stores
  WHERE id = p_sender_store_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Store not found'
    );
  END IF;

  IF v_current_balance < p_total_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points balance'
    );
  END IF;

  -- Generate order number
  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD-') || 
                    lpad(nextval('order_number_seq')::text, 6, '0');

  -- Extract receiver store id
  v_receiver_store_id := (p_order_data->>'receiver_store_id')::uuid;
  
  -- Calculate commission (25% of subtotal)
  v_commission := COALESCE((p_order_data->'payment'->>'commission')::integer, 
                           floor((p_order_data->'payment'->>'subtotal')::integer * 0.25));

  -- Create order
  INSERT INTO orders (
    order_number,
    sender_store_id,
    receiver_store_id,
    type,
    status,
    customer,
    recipient,
    product,
    payment,
    created_at,
    updated_at
  ) VALUES (
    v_order_number,
    p_sender_store_id,
    v_receiver_store_id,
    COALESCE(p_order_data->>'type', 'send')::order_type,
    'pending',
    p_order_data->'customer',
    p_order_data->'recipient',
    p_order_data->'product',
    p_order_data->'payment',
    now(),
    now()
  ) RETURNING id INTO v_order_id;

  -- Deduct points from sender
  UPDATE stores
  SET points_balance = points_balance - p_total_amount,
      updated_at = now()
  WHERE id = p_sender_store_id;

  -- Create point transaction for sender
  INSERT INTO point_transactions (
    store_id,
    type,
    amount,
    balance_after,
    description,
    reference_type,
    reference_id,
    created_at
  ) VALUES (
    p_sender_store_id,
    'order_payment',
    -p_total_amount,
    v_current_balance - p_total_amount,
    '주문 결제: ' || v_order_number,
    'order',
    v_order_id,
    now()
  );

  -- If there's a receiver store, add pending points
  IF v_receiver_store_id IS NOT NULL THEN
    -- The actual points will be added when order is completed
    -- Just record that this order will generate revenue
    INSERT INTO point_transactions (
      store_id,
      type,
      amount,
      balance_after,
      description,
      reference_type,
      reference_id,
      status,
      created_at
    ) VALUES (
      v_receiver_store_id,
      'order_revenue',
      p_total_amount - v_commission, -- Revenue after commission
      (SELECT points_balance FROM stores WHERE id = v_receiver_store_id), -- Current balance (not changed yet)
      '주문 수주 (대기): ' || v_order_number,
      'order',
      v_order_id,
      'pending', -- Will be 'completed' when order is completed
      now()
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
END;
$$;

-- Create sequence for order numbers if not exists
CREATE SEQUENCE IF NOT EXISTS order_number_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_order_with_payment TO authenticated;
GRANT USAGE ON SEQUENCE order_number_seq TO authenticated;
