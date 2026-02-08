-- Atomic point deduction to prevent race conditions
CREATE OR REPLACE FUNCTION deduct_points_atomic(
  p_phone TEXT,
  p_amount INTEGER,
  p_order_id UUID
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_deducted INTEGER := 0;
BEGIN
  -- Lock and update coupons in single transaction
  WITH available AS (
    SELECT id, amount
    FROM coupons
    WHERE customer_phone = p_phone
      AND used_at IS NULL
      AND expires_at > NOW()
    ORDER BY expires_at ASC
    FOR UPDATE SKIP LOCKED
  ),
  to_use AS (
    SELECT id, amount,
      SUM(amount) OVER (ORDER BY expires_at) as running_total
    FROM available
  ),
  selected AS (
    SELECT id, amount
    FROM to_use
    WHERE running_total - amount < p_amount
  )
  UPDATE coupons
  SET used_at = NOW(),
      used_order_id = p_order_id
  WHERE id IN (SELECT id FROM selected)
  RETURNING SUM(amount) INTO v_deducted;

  IF v_deducted < p_amount THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  RETURN json_build_object(
    'success', true,
    'deducted', v_deducted
  );
END;
$$ LANGUAGE plpgsql;