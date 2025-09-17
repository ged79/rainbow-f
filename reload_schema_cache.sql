-- Supabase 캐시 갱신
-- Run this in SQL Editor

-- 1. 테이블 스키마 재로드
NOTIFY pgrst, 'reload schema';

-- 2. members 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
ORDER BY ordinal_position;

-- 3. 테스트 INSERT (성공해야 함)
INSERT INTO members (phone, password, name, email, points)
VALUES ('test-' || gen_random_uuid(), 'test', 'Test User', 'test@test.com', 0)
RETURNING *;