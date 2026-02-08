-- 1. 모든 orders 관련 트리거 확인 및 삭제
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'orders'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON orders CASCADE';
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- 2. 문제가 되는 함수 삭제
DROP FUNCTION IF EXISTS add_order_to_settlement() CASCADE;
DROP FUNCTION IF EXISTS handle_order_completion() CASCADE;
DROP FUNCTION IF EXISTS process_order_completion() CASCADE;

-- 3. 간단한 업데이트 함수 생성 (트리거 없이)
CREATE OR REPLACE FUNCTION complete_order_direct(
    p_order_id UUID,
    p_recipient_name TEXT,
    p_recipient_phone TEXT,
    p_note TEXT,
    p_photos TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE orders
    SET 
        status = 'completed',
        completion = jsonb_build_object(
            'recipient_name', p_recipient_name,
            'recipient_phone', p_recipient_phone,
            'note', p_note,
            'completed_at', NOW(),
            'photos', p_photos
        ),
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_order_direct TO authenticated;

-- 4. 확인
SELECT 'Triggers removed successfully' as status;