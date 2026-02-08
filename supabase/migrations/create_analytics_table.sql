-- Analytics 테이블 생성
CREATE TABLE IF NOT EXISTS public.page_analytics (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  session_id TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_page_analytics_visited_at ON public.page_analytics(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_analytics_path ON public.page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_page_analytics_referrer ON public.page_analytics(referrer);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visitor_id ON public.page_analytics(visitor_id);

-- RLS 활성화
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 데이터 삽입은 누구나 가능 (미들웨어에서)
CREATE POLICY "allow_insert_analytics" ON public.page_analytics
  FOR INSERT WITH CHECK (true);

-- RLS 정책: 조회는 service_role (관리자) 또는 authenticated 사용자만
CREATE POLICY "allow_admin_select" ON public.page_analytics
  FOR SELECT USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 그래프 데이터용 뷰: 시간별 방문자
CREATE OR REPLACE VIEW public.analytics_hourly AS
SELECT
  DATE_TRUNC('hour', visited_at) as hour,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(*) as total_visits
FROM page_analytics
GROUP BY DATE_TRUNC('hour', visited_at)
ORDER BY hour DESC;

-- 그래프 데이터용 뷰: 일별 방문자
CREATE OR REPLACE VIEW public.analytics_daily AS
SELECT
  DATE_TRUNC('day', visited_at)::DATE as day,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(*) as total_visits
FROM page_analytics
GROUP BY DATE_TRUNC('day', visited_at)
ORDER BY day DESC;

-- 권한 설정
GRANT SELECT ON public.page_analytics TO authenticated;
GRANT SELECT ON public.page_analytics TO anon;
GRANT INSERT ON public.page_analytics TO anon;
GRANT SELECT ON public.analytics_hourly TO authenticated;
GRANT SELECT ON public.analytics_daily TO authenticated;
