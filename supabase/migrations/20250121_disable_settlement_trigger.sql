-- 정산 관련 트리거 비활성화
-- 2025-01-21

-- 함수가 존재하는지 확인하고 삭제
DROP FUNCTION IF EXISTS add_order_to_settlement() CASCADE;

-- 혹시 모를 트리거 삭제
DROP TRIGGER IF EXISTS on_order_complete_settlement ON orders;
DROP TRIGGER IF EXISTS trigger_add_order_to_settlement ON orders;

-- settlements 테이블의 unique constraint 확인
-- 이미 존재하면 무시
ALTER TABLE settlements DROP CONSTRAINT IF EXISTS unique_store_period;

-- 새로운 constraint 추가 (IF NOT EXISTS는 지원 안됨)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_store_period'
    ) THEN
        ALTER TABLE settlements 
        ADD CONSTRAINT unique_store_period 
        UNIQUE (store_id, period_start, period_end);
    END IF;
END $$;