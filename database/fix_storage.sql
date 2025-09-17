-- Supabase Storage 권한 설정

-- 1. products 버킷이 없으면 생성 (Supabase Dashboard > Storage에서)
-- 버킷명: products
-- Public 버킷으로 설정

-- 2. Storage 정책 설정
-- Supabase Dashboard > Storage > Policies에서 설정하거나 아래 SQL 실행

-- 모든 사용자가 읽기 가능
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

-- 인증된 사용자만 업데이트 가능
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');
