-- members 테이블 RLS 정책 재확인
SELECT * FROM pg_policies 
WHERE tablename = 'members';

-- RLS 비활성화 테스트 (임시)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- 테스트 후 다시 활성화
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;