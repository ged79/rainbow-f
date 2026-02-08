-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_notices_active ON notices(is_active);
CREATE INDEX idx_notices_pinned ON notices(is_pinned);
CREATE INDEX idx_notices_created_at ON notices(created_at);

-- RLS 활성화
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 활성 공지사항 읽기 가능
CREATE POLICY "Anyone can view active notices" ON notices
  FOR SELECT
  USING (is_active = true);

-- 관리자만 생성/수정/삭제 가능
CREATE POLICY "Admin can manage notices" ON notices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);