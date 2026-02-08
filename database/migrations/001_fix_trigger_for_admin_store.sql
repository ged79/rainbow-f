-- 트리거 수정: 본사 ID로 배정된 경우 orders 테이블에 복사하지 않음
CREATE OR REPLACE FUNCTION sync_customer_order_to_orders()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_order_exists BOOLEAN;
  v_admin_store_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- assigned_store_id가 설정되고 본사가 아닌 경우만 동기화
  IF NEW.assigned_store_id IS NOT NULL 
     AND OLD.assigned_store_id IS NULL 
     AND NEW.assigned_store_id != v_admin_store_id THEN
    
    -- 중복 체크 (order_number로)
    SELECT EXISTS(
      SELECT 1 FROM orders 
      WHERE order_number = NEW.order_number
    ) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
      v_order_id := gen_random_uuid();
      
      INSERT INTO orders (
        id,
        order_number,
        sender_store_id,
        receiver_store_id,
        type,
        customer,
        recipient,
        product,
        payment,
        status,
        delivery_date,
        delivery_time,
        created_at,
        updated_at
      ) VALUES (
        v_order_id,
        NEW.order_number,
        v_admin_store_id,
        NEW.assigned_store_id,
        'receive',
        jsonb_build_object(
          'name', NEW.customer_name,
          'phone', NEW.customer_phone,
          'memo', '',
          'company', ''
        ),
        jsonb_build_object(
          'name', NEW.recipient_name,
          'phone', NEW.recipient_phone,
          'address', NEW.recipient_address
        ),
        jsonb_build_object(
          'type', COALESCE(NEW.mapped_category, '기타'),
          'name', NEW.product_name,
          'price', COALESCE(NEW.mapped_price, NEW.original_price),
          'quantity', COALESCE(NEW.quantity, 1),
          'ribbon_text', COALESCE(NEW.ribbon_text, ARRAY[]::TEXT[]),
          'special_instructions', COALESCE(NEW.special_instructions, '')
        ),
        jsonb_build_object(
          'subtotal', COALESCE(NEW.mapped_price, NEW.original_price),
          'additional_fee', 0,
          'additional_fee_reason', '',
          'commission', ROUND(COALESCE(NEW.mapped_price, NEW.original_price) * 0.25),
          'total', COALESCE(NEW.mapped_price, NEW.original_price),
          'points_used', 0,
          'points_after', 0
        ),
        'pending'::order_status,
        NEW.delivery_date::DATE,
        COALESCE(NEW.delivery_time, '14:00'),
        NEW.created_at,
        NOW()
      );
      
      -- linked_order_id 업데이트
      UPDATE customer_orders 
      SET linked_order_id = v_order_id 
      WHERE id = NEW.id;
      
      RAISE NOTICE 'Homepage 주문 % 을(를) orders 테이블에 동기화했습니다', NEW.order_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 재생성
DROP TRIGGER IF EXISTS sync_homepage_orders ON customer_orders;
CREATE TRIGGER sync_homepage_orders
  AFTER UPDATE OF assigned_store_id ON customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_order_to_orders();
