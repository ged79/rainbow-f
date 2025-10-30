-- Supabase 사용자 삭제 SQL
-- admin@flower.com을 제외한 모든 사용자 삭제

-- 1. 먼저 삭제할 사용자 확인
SELECT 
  id,
  email,
  created_at,
  CASE 
    WHEN email = 'admin@flower.com' THEN '🔒 보존'
    ELSE '🗑️ 삭제 대상'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. admin@flower.com을 제외한 모든 사용자 삭제
-- ⚠️ 이 쿼리는 실제로 데이터를 삭제합니다!

-- 2-1. users 테이블에서 먼저 삭제 (FK 제약조건 때문에)
DELETE FROM public.users
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email != 'admin@flower.com' 
  OR email IS NULL
);

-- 2-2. auth.users에서 삭제
DELETE FROM auth.users
WHERE email != 'admin@flower.com' 
OR email IS NULL;

-- 3. 삭제 결과 확인
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email = 'admin@flower.com' THEN 1 END) as admin_count,
  COUNT(CASE WHEN email != 'admin@flower.com' OR email IS NULL THEN 1 END) as other_count
FROM auth.users;

-- 4. 남은 사용자 목록
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;
