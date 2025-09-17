-- =============================================
-- Homepage 주문을 Client orders 테이블로 자동 동기화
-- 작성일: 2025-01-16
-- 목적: customer_orders 배정 시 orders 테이블에 자동 생성
-- =============================================

-- 0. Admin 시스템 store 생성 (없으면 생성)
INSERT INTO stores (
  id,
  user_id,
  store_code,
  business_name,
  owner_name,
  business_license,
  phone,
  email,
  address,
  service_areas,
  points_balance,
  commission_rate,
  bank_name,
  account_number,
  account_holder,
  status,
  is_open,
  rating,
  total_orders_sent,
  total_orders_received,
  total_sales,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'ADMIN',
  '홈페이지 주문 시스템',
  '시스템관리자',
  '000-00-00000',
  '1600-0000',
  'admin@flower.com',
  jsonb_build_object('sido', '서울특별시', 'sigungu', '강남구'),
  ARRAY['전국']::TEXT[],
  0,
  0,
  '',
  '',
  '',
  'active',
  true,
  5.0,
  0,
  0,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 1. 동기화 함수 생성
CREATE OR REPLACE FUNCTION sync_customer_order_to_orders()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_order_exists BOOLEAN;
  v_admin_store_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- assigned_store_id가 설정될 때만 동기화 (최초 배정 시)
  IF NEW.assigned_store_id IS NOT NULL AND OLD.assigned_store_id IS NULL THEN
    
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
        v_admin_store_id,  -- Admin 시스템 store를 sender로
        NEW.assigned_store_id,
        'receive',  -- 받는 주문으로 처리
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
        'pending'::order_status,  -- 타입 캐스팅
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

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS sync_homepage_orders ON customer_orders;
CREATE TRIGGER sync_homepage_orders
  AFTER UPDATE OF assigned_store_id ON customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_order_to_orders();

-- 3. 기존 배정된 주문 동기화 (한 번만 실행)
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
)
SELECT 
  gen_random_uuid(),
  co.order_number,
  '00000000-0000-0000-0000-000000000000'::UUID,  -- Admin store
  co.assigned_store_id,
  'receive',
  jsonb_build_object(
    'name', co.customer_name,
    'phone', co.customer_phone,
    'memo', '',
    'company', ''
  ),
  jsonb_build_object(
    'name', co.recipient_name,
    'phone', co.recipient_phone,
    'address', co.recipient_address
  ),
  jsonb_build_object(
    'type', COALESCE(co.mapped_category, '기타'),
    'name', co.product_name,
    'price', COALESCE(co.mapped_price, co.original_price),
    'quantity', COALESCE(co.quantity, 1),
    'ribbon_text', COALESCE(co.ribbon_text, ARRAY[]::TEXT[]),
    'special_instructions', COALESCE(co.special_instructions, '')
  ),
  jsonb_build_object(
    'subtotal', COALESCE(co.mapped_price, co.original_price),
    'additional_fee', 0,
    'additional_fee_reason', '',
    'commission', ROUND(COALESCE(co.mapped_price, co.original_price) * 0.25),
    'total', COALESCE(co.mapped_price, co.original_price),
    'points_used', 0,
    'points_after', 0
  ),
  (CASE 
    WHEN co.status = 'assigned' THEN 'pending'
    WHEN co.status = 'completed' THEN 'completed'
    ELSE 'pending'
  END)::order_status,
  co.delivery_date::DATE,
  COALESCE(co.delivery_time, '14:00'),
  co.created_at,
  NOW()
FROM customer_orders co
WHERE co.assigned_store_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.order_number = co.order_number
  );

-- 4. 동기화 확인
SELECT 
  'customer_orders' as source,
  COUNT(*) as count,
  COUNT(CASE WHEN assigned_store_id IS NOT NULL THEN 1 END) as assigned_count
FROM customer_orders
UNION ALL
SELECT 
  'orders (from homepage)' as source,
  COUNT(*) as count,
  COUNT(*) as assigned_count
FROM orders 
WHERE sender_store_id = '00000000-0000-0000-0000-000000000000'::UUID;

-- 5. 상태 동기화 트리거 (orders → customer_orders)
CREATE OR REPLACE FUNCTION sync_order_status_to_customer_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Homepage 주문인 경우 (Admin store가 sender)
  IF NEW.sender_store_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
    UPDATE customer_orders
    SET 
      status = CASE 
        WHEN NEW.status = 'pending' THEN 'assigned'
        WHEN NEW.status = 'accepted' THEN 'processing'
        WHEN NEW.status = 'completed' THEN 'completed'
        WHEN NEW.status = 'cancelled' THEN 'cancelled'
        WHEN NEW.status = 'rejected' THEN 'pending'  -- 거절 시 재배정 필요
        ELSE status
      END,
      updated_at = NOW()
    WHERE order_number = NEW.order_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_order_status_back ON orders;
CREATE TRIGGER sync_order_status_back
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_status_to_customer_orders();

COMMENT ON FUNCTION sync_customer_order_to_orders() IS 'Homepage 주문을 Client orders 테이블로 동기화';
COMMENT ON FUNCTION sync_order_status_to_customer_orders() IS 'orders 상태 변경을 customer_orders로 역동기화';