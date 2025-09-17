-- members INSERT 정책 재생성
DROP POLICY IF EXISTS "members_anon_insert" ON members;
CREATE POLICY "members_anon_insert" ON members 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- UPDATE 정책도 추가 (password_hash 업데이트용)
CREATE POLICY "members_anon_update" ON members
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 확인
SELECT * FROM pg_policies WHERE tablename = 'members';