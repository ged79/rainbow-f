-- Supabase Storage 버킷 권한 설정
-- delivery-photos 버킷이 public 접근 가능하도록 설정

-- 1. 버킷 생성 (이미 있으면 스킵)
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. RLS 정책 - 모든 사용자가 읽기 가능
CREATE POLICY "Public read access to delivery photos" ON storage.objects
FOR SELECT
USING (bucket_id = 'delivery-photos');

-- 3. RLS 정책 - 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload delivery photos" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-photos');

-- 4. 확인
SELECT * FROM storage.buckets WHERE id = 'delivery-photos';
