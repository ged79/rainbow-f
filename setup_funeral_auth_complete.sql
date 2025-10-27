-- ============================================
-- Funeral Homes 인증 시스템 설정
-- ============================================

-- 1. funeral_homes 테이블에 login_id 컬럼 추가
ALTER TABLE funeral_homes 
ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE;

-- 2. 기존 장례식장에 login_id 설정
-- 영동병원장례식장이 이미 있다고 가정
UPDATE funeral_homes 
SET login_id = 'yeongdong'
WHERE name LIKE '%영동%';

-- 3. 테스트 계정용 비밀번호 해시 업데이트
-- 비밀번호: yeongdong2024!
-- 실제 해시는 generate_hash.js로 생성 후 아래 값 교체
UPDATE funeral_homes 
SET password_hash = '$2a$10$YourGeneratedHashHere'
WHERE login_id = 'yeongdong';

-- 4. 확인
SELECT 
  id,
  name,
  login_id,
  CASE 
    WHEN password_hash IS NOT NULL THEN '설정됨'
    ELSE '미설정'
  END as password_status,
  status,
  created_at
FROM funeral_homes
ORDER BY created_at DESC;

-- ============================================
-- RLS 정책 확인
-- ============================================

-- funeral_homes 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'funeral_homes';

-- funerals 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'funerals';
