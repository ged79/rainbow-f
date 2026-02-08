-- RLS 정책 임시 비활성화 (테스트용)
ALTER TABLE funeral_homes DISABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_users DISABLE ROW LEVEL SECURITY;

-- 또는 정책 수정: 로그인한 모든 사용자 허용
DROP POLICY IF EXISTS "Admin can insert funeral homes" ON funeral_homes;

CREATE POLICY "Authenticated users can insert funeral homes"
  ON funeral_homes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view funeral homes"
  ON funeral_homes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update funeral homes"
  ON funeral_homes FOR UPDATE
  TO authenticated
  USING (true);
