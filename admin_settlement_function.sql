-- Admin 정산 처리 기능
CREATE OR REPLACE FUNCTION process_settlement(
  p_settlement_id uuid,
  p_admin_user_id uuid,
  p_transfer_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settlement settlements%ROWTYPE;
  v_store stores%ROWTYPE;
BEGIN
  -- 정산 정보 조회
  SELECT * INTO v_settlement
  FROM settlements
  WHERE id = p_settlement_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Settlement not found'
    );
  END IF;
  
  IF v_settlement.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Settlement already processed'
    );
  END IF;
  
  -- 가게 정보 조회
  SELECT * INTO v_store
  FROM stores
  WHERE id = v_settlement.store_id;
  
  -- 정산 상태 업데이트
  UPDATE settlements
  SET 
    status = 'completed',
    processed_at = now(),
    processed_by = p_admin_user_id,
    bank_name = v_store.bank_name,
    account_number = v_store.account_number,
    account_holder = v_store.account_holder,
    transfer_note = p_transfer_note,
    updated_at = now()
  WHERE id = p_settlement_id;
  
  -- 포인트 거래 기록 업데이트
  UPDATE point_transactions
  SET metadata = jsonb_build_object(
    'processed_at', now(),
    'processed_by', p_admin_user_id
  )
  WHERE settlement_id = p_settlement_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'settlement_id', p_settlement_id,
    'amount', v_settlement.settlement_amount,
    'store_name', v_store.business_name
  );
END;
$$;

-- Admin 권한 부여
GRANT EXECUTE ON FUNCTION process_settlement TO authenticated;
