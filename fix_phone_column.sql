-- phone 컬럼 길이 확장
ALTER TABLE members 
ALTER COLUMN phone TYPE VARCHAR(50);

-- 확인
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'members' AND column_name = 'phone';