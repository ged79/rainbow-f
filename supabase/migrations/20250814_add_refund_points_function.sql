-- 포인트 환불 함수 생성
CREATE OR REPLACE FUNCTION refund_points(
  p_store_id UUID,
  p_amount INTEGER,
  p_order_id UUID
)
RETURNS void AS $$
BEGIN
  -- 포인트 환불
  UPDATE stores
  SET points_balance = points_balance + p_amount
  WHERE id = p_store_id;
  
  -- 트랜잭션 기록
  INSERT INTO point_transactions (
    store_id,
    type,
    amount,
    balance_before,
    balance_after,
    description,
    order_id
  )
  SELECT
    p_store_id,
    'refund',
    p_amount,
    points_balance - p_amount,
    points_balance,
    '주문 수정 환불',
    p_order_id
  FROM stores
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
