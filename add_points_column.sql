-- members 테이블에 points 컬럼 추가
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'members';