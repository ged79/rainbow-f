import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 방문자 정보 기록
 */
export async function recordPageView({
  pagePath,
  referrer,
  userAgent,
  ipAddress,
}: {
  pagePath: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  try {
    // 디바이스 타입 감지
    const deviceType = detectDeviceType(userAgent || '');
    const browser = detectBrowser(userAgent || '');

    // 고유한 visitor_id 생성 (IP + User-Agent 기반)
    const visitorId = generateVisitorId(ipAddress, userAgent);
    const sessionId = generateSessionId();

    // Supabase에 저장
    const { error } = await supabase.from('page_analytics').insert([
      {
        visitor_id: visitorId,
        page_path: pagePath,
        referrer: referrer || null,
        user_agent: userAgent || null,
        ip_address: ipAddress || null,
        device_type: deviceType,
        browser: browser,
        session_id: sessionId,
        visited_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('[Analytics] Error recording page view:', error);
    }

    return { success: !error, visitorId, sessionId };
  } catch (err) {
    console.error('[Analytics] Unexpected error:', err);
    return { success: false };
  }
}

/**
 * 디바이스 타입 감지
 */
function detectDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad|iPod/.test(userAgent)) {
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

/**
 * 브라우저 감지
 */
function detectBrowser(userAgent: string): string {
  if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent))
    return 'Chrome';
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'Safari';
  if (/Firefox/.test(userAgent)) return 'Firefox';
  if (/Edge|Edg/.test(userAgent)) return 'Edge';
  if (/Opera|OPR/.test(userAgent)) return 'Opera';
  return 'Unknown';
}

/**
 * 방문자 ID 생성 (IP + User-Agent 기반)
 * crypto 모듈 대신 간단한 해싱 사용 (Edge Runtime 호환)
 */
function generateVisitorId(ip?: string, userAgent?: string): string {
  const combined = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer
  }
  
  return Math.abs(hash).toString(16).substring(0, 16);
}

/**
 * 세션 ID 생성
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 분석 데이터 조회 (GED님용)
 */
export async function getAnalytics(days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // 모든 데이터 가져오기
    const { data: allData, error } = await supabase
      .from('page_analytics')
      .select('*')
      .gte('visited_at', since.toISOString())
      .order('visited_at', { ascending: false })
      .limit(10000)
      .returns<any[]>();

    if (error) {
      console.error('[Analytics] Error fetching data:', error);
      return null;
    }

    if (!allData || allData.length === 0) {
      return {
        totalVisitors: 0,
        topPages: [],
        topReferrers: [],
        deviceStats: [],
        browserStats: [],
      };
    }

    // 클라이언트 측 그룹화 및 집계
    const uniqueVisitors = new Set(allData.map(d => d.visitor_id));

    // 페이지별 집계
    const pageMap = new Map<string, number>();
    allData.forEach(d => {
      const path = d.page_path || '/'
      pageMap.set(path, (pageMap.get(path) || 0) + 1);
    });
    const topPages = Array.from(pageMap.entries())
      .map(([page_path, count]) => ({ page_path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 참조별 집계
    const referrerMap = new Map<string, number>();
    allData.forEach(d => {
      if (d.referrer) {
        referrerMap.set(d.referrer, (referrerMap.get(d.referrer) || 0) + 1);
      }
    });
    const topReferrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 기기별 집계
    const deviceMap = new Map<string, number>();
    allData.forEach(d => {
      const device = d.device_type || '불명'
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    const deviceStats = Array.from(deviceMap.entries())
      .map(([device_type, count]) => ({ device_type, count }))
      .sort((a, b) => b.count - a.count);

    // 브라우저별 집계
    const browserMap = new Map<string, number>();
    allData.forEach(d => {
      const browser = d.browser || 'Unknown'
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });
    const browserStats = Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalVisitors: uniqueVisitors.size,
      topPages,
      topReferrers,
      deviceStats,
      browserStats,
    };
  } catch (error) {
    console.error('[Analytics] Error fetching analytics:', error);
    return null;
  }
}
