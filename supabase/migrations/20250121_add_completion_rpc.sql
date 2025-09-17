-- RPC 함수로 주문 완료 처리 (트리거 우회)
CREATE OR REPLACE FUNCTION update_order_completion(
  order_id UUID,
  completion_data JSONB
)
RETURNS orders AS $$
DECLARE
  v_order orders;
BEGIN
  -- 직접 UPDATE 실행 (트리거 우회)
  UPDATE orders
  SET 
    status = 'completed',
    completion = completion_data,
    updated_at = NOW()
  WHERE id = order_id
  RETURNING * INTO v_order;
  
  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 권한 부여
GRANT EXECUTE ON FUNCTION update_order_completion TO authenticated;