-- 1. funeral_homes 테이블에 password 컬럼 추가
ALTER TABLE funeral_homes 
ADD COLUMN password_hash TEXT;

-- 2. RLS 정책 수정 - funerals 테이블
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON funerals;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON funerals;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON funerals;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON funerals;

-- 자신의 funeral_home_id만 접근 가능 (세션에서 확인)
CREATE POLICY "Funeral homes can manage their own data" 
ON funerals FOR ALL
USING (funeral_home_id::text = current_setting('app.funeral_home_id', true))
WITH CHECK (funeral_home_id::text = current_setting('app.funeral_home_id', true));

-- Admin은 모든 데이터 조회 가능 (읽기 전용)
CREATE POLICY "Admin can view all funerals" 
ON funerals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = current_setting('app.user_id', true)
  )
);

-- 3. condolence_messages 정책 수정
DROP POLICY IF EXISTS "Allow insert condolence messages" ON condolence_messages;
DROP POLICY IF EXISTS "Allow select condolence messages" ON condolence_messages;

-- 누구나 조회/작성 가능 (공개 조문)
CREATE POLICY "Anyone can view condolence messages" 
ON condolence_messages FOR SELECT
USING (true);

CREATE POLICY "Anyone can add condolence messages" 
ON condolence_messages FOR INSERT
WITH CHECK (true);

-- 4. funeral_homes 정책
CREATE POLICY "Anyone can view active funeral homes" 
ON funeral_homes FOR SELECT
USING (status = 'active');

CREATE POLICY "Admin can manage funeral homes" 
ON funeral_homes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = current_setting('app.user_id', true)
  )
);

-- 5. customer_orders 정책 (Admin만 접근)
CREATE POLICY "Admin can manage orders" 
ON customer_orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE id::text = current_setting('app.user_id', true)
  )
);
