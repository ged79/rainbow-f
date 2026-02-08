-- 주문 완료 시 정산 자동 생성 트리거
CREATE OR REPLACE FUNCTION create_settlement_on_order_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_settlement_id uuid;
  v_commission_amount integer;
  v_net_amount integer;
BEGIN
  -- 주문이 completed 상태로 변경될 때만
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 수주 화원이 있는 경우만 정산 생성
    IF NEW.receiver_store_id IS NOT NULL THEN
      -- 수수료 계산 (25%)
      v_commission_amount := floor((NEW.payment->>'subtotal')::integer * 0.25);
      v_net_amount := (NEW.payment->>'total')::integer - v_commission_amount;
      
      -- 정산 생성
      INSERT INTO settlements (
        store_id,
        period_start,
        period_end,
        total_orders,
        order_ids,
        total_amount,
        commission_rate,
        commission_amount,
        net_amount,
        settlement_amount,
        status,
        created_at
      ) VALUES (
        NEW.receiver_store_id,
        NEW.created_at::date,
        NEW.updated_at::date,
        1,
        ARRAY[NEW.id],
        (NEW.payment->>'total')::integer,
        0.25,
        v_commission_amount,
        v_net_amount,
        v_net_amount,
        'pending',
        now()
      ) RETURNING id INTO v_settlement_id;
      
      -- 수주 화원에 포인트 추가
      UPDATE stores 
      SET points_balance = points_balance + v_net_amount
      WHERE id = NEW.receiver_store_id;
      
      -- 포인트 거래 기록
      INSERT INTO point_transactions (
        store_id,
        type,
        amount,
        balance_before,
        balance_after,
        order_id,
        settlement_id,
        description,
        created_at
      ) VALUES (
        NEW.receiver_store_id,
        'income',
        v_net_amount,
        (SELECT points_balance - v_net_amount FROM stores WHERE id = NEW.receiver_store_id),
        (SELECT points_balance FROM stores WHERE id = NEW.receiver_store_id),
        NEW.id,
        v_settlement_id,
        '주문 수익: ' || NEW.order_number,
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_create_settlement_on_complete ON orders;
CREATE TRIGGER trigger_create_settlement_on_complete
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_settlement_on_order_complete();

-- 기존 완료된 주문에 대한 정산 생성 (한 번만 실행)
INSERT INTO settlements (
  store_id,
  period_start,
  period_end,
  total_orders,
  order_ids,
  total_amount,
  commission_rate,
  commission_amount,
  net_amount,
  settlement_amount,
  status,
  created_at
)
SELECT 
  o.receiver_store_id,
  o.created_at::date,
  o.updated_at::date,
  1,
  ARRAY[o.id],
  (o.payment->>'total')::integer,
  0.25,
  floor((o.payment->>'subtotal')::integer * 0.25),
  (o.payment->>'total')::integer - floor((o.payment->>'subtotal')::integer * 0.25),
  (o.payment->>'total')::integer - floor((o.payment->>'subtotal')::integer * 0.25),
  'pending',
  now()
FROM orders o
WHERE o.status = 'completed' 
AND o.receiver_store_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM settlements s 
  WHERE o.id = ANY(s.order_ids)
);
