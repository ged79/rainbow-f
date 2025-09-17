-- Fix DB schema and type mismatches
-- Created: 2025-08-27

-- 1. Add completion_photos field to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completion_photos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Add customer_company field to orders table (JSONB)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'customer' 
    AND data_type = 'jsonb'
  ) THEN
    -- Customer field already exists as JSONB, just ensure it can have company field
    COMMENT ON COLUMN orders.customer IS 'Customer info: {name, phone, memo?, company?}';
  END IF;
END $$;

-- 3. Create view for OrderWithStores type support
CREATE OR REPLACE VIEW orders_with_stores AS
SELECT 
  o.*,
  ss.business_name AS sender_store_name,
  ss.phone AS sender_store_phone,
  ss.address AS sender_store_address,
  rs.business_name AS receiver_store_name,
  rs.phone AS receiver_store_phone,
  rs.address AS receiver_store_address,
  jsonb_build_object(
    'id', ss.id,
    'business_name', ss.business_name,
    'phone', ss.phone,
    'address', ss.address,
    'status', ss.status,
    'is_open', ss.is_open
  ) AS sender_store,
  CASE 
    WHEN rs.id IS NOT NULL THEN
      jsonb_build_object(
        'id', rs.id,
        'business_name', rs.business_name,
        'phone', rs.phone,
        'address', rs.address,
        'status', rs.status,
        'is_open', rs.is_open
      )
    ELSE NULL
  END AS receiver_store
FROM orders o
LEFT JOIN stores ss ON o.sender_store_id = ss.id
LEFT JOIN stores rs ON o.receiver_store_id = rs.id;

-- Grant access to the view
GRANT SELECT ON orders_with_stores TO authenticated;

-- 4. Add completion metadata fields
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS completion_recipient_name TEXT,
ADD COLUMN IF NOT EXISTS completion_recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS completion_note TEXT,
ADD COLUMN IF NOT EXISTS completion_completed_at TIMESTAMPTZ;

-- 5. Create function to transform completion data
CREATE OR REPLACE FUNCTION format_order_completion(p_order orders)
RETURNS jsonb AS $$
BEGIN
  IF p_order.status = 'completed' THEN
    RETURN jsonb_build_object(
      'photos', COALESCE(p_order.completion_photos, ARRAY[]::TEXT[]),
      'recipient_name', COALESCE(p_order.completion_recipient_name, ''),
      'recipient_phone', p_order.completion_recipient_phone,
      'note', p_order.completion_note,
      'completed_at', COALESCE(p_order.completion_completed_at, p_order.updated_at)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Update existing complete order function to save all fields
CREATE OR REPLACE FUNCTION complete_order_with_details(
  p_order_id UUID,
  p_recipient_name TEXT,
  p_recipient_phone TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_photos TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS jsonb AS $$
DECLARE
  v_order orders;
BEGIN
  -- Update order
  UPDATE orders
  SET 
    status = 'completed',
    completion_photos = p_photos,
    completion_recipient_name = p_recipient_name,
    completion_recipient_phone = p_recipient_phone,
    completion_note = p_note,
    completion_completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Return formatted completion data
  RETURN jsonb_build_object(
    'success', true,
    'order', row_to_json(v_order),
    'completion', format_order_completion(v_order)
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_order_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION format_order_completion TO authenticated;

-- 7. Add index for completion queries
CREATE INDEX IF NOT EXISTS idx_orders_completion_photos 
ON orders USING GIN(completion_photos)
WHERE completion_photos IS NOT NULL AND array_length(completion_photos, 1) > 0;

-- 8. Add comment for documentation
COMMENT ON TABLE orders IS 'Orders table with completion tracking and photo storage';
