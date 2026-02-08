-- =============================================
-- Supabase Storage 버킷 설정
-- =============================================

-- 1. Storage 버킷 생성 (Supabase Dashboard에서 실행)
-- Storage > New Bucket 클릭
-- Name: product-images
-- Public bucket: ✅ 체크
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- 2. RLS 정책 설정
-- 이 SQL은 SQL Editor에서 실행

-- 공개 읽기 정책
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 인증된 사용자만 수정 가능
CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 3. 테스트 쿼리
SELECT 
  id,
  display_name,
  price,
  image_url,
  images,
  is_active
FROM products 
WHERE is_active = true
LIMIT 5;
