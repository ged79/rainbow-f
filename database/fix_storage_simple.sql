-- Supabase Dashboard에서 확인 및 수정

-- 1. Storage 버킷 확인
-- Storage > products 버킷 선택

-- 2. 현재 정책 모두 삭제 후 다시 설정

-- 3. 새로운 정책 (2개만 필요)

-- 정책 1: 모든 사용자 읽기
-- Name: Allow public read
-- Allowed operation: SELECT
-- Policy definition:
true

-- 정책 2: 인증 사용자 모든 작업
-- Name: Allow authenticated all
-- Allowed operation: INSERT, UPDATE, DELETE
-- Policy definition:
auth.role() = 'authenticated'

-- 또는 가장 간단한 해결책:
-- Storage > products 버킷 > Configuration
-- RLS enabled 토글을 OFF로 설정 (개발용)
