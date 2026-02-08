# 📊 Analytics Setup Guide

Rainbow-F 방문자 분석 시스템 설정 가이드입니다.

## ✅ 구현된 기능

### 1. **Supabase 데이터 저장소**
- 모든 방문자 정보 저장 (IP, User-Agent, 페이지, 유입 경로)
- RLS 정책으로 보안 강화
- 시간별/일별 분석 뷰 제공

### 2. **Next.js 미들웨어**
- 모든 페이지 방문을 자동으로 기록
- 요청을 블록하지 않음 (백그라운드 실행)
- IP, User-Agent, Referrer 수집

### 3. **관리자 대시보드**
- URL: `/admin/analytics`
- 비밀번호 보호 (GED님만 접근)
- 실시간 통계, 인기 페이지, 유입 경로 분석

### 4. **Google Analytics (선택사항)**
- 추가 분석 데이터
- GED님 Gmail 계정으로만 접근 가능

---

## 🚀 설정 단계

### **Step 1: Supabase 테이블 생성**

1. [Supabase 대시보드](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. **SQL Editor** → **New Query**
4. 다음 파일의 내용을 복사해서 붙여넣기:
   ```
   supabase/migrations/create_analytics_table.sql
   ```
5. **Run** 클릭 ✅

### **Step 2: .env.local 확인**

파일 위치: `apps/homepage/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://qvgxqluwumbgslbxaeaq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (자동 설정됨)
```

이미 설정되어 있습니다.

### **Step 3: 대시보드 접근**

```
https://rainbow-f.kr/admin/analytics
```

비밀번호: `rainbow2025` (나중에 변경 가능)

### **Step 4: Google Analytics 연동 (선택사항)**

1. [Google Analytics](https://analytics.google.com/) 접속
2. 새 프로퍼티 생성
   - 웹사이트: `https://rainbow-f.kr`
   - 측정 ID: `G_XXXX...`

3. `.env.local`에 추가:
   ```env
   NEXT_PUBLIC_GA_ID=G_XXXXXXXXXXXX
   ```

4. Netlify 배포 시 자동으로 적용됩니다.

---

## 📊 대시보드 기능

### 통계 카드
- **총 방문자**: 지정 기간 내 고유 방문자 수
- **인기 페이지**: 접속한 페이지 목록
- **유입 경로**: 외부 링크에서의 유입
- **기기 분포**: 모바일/태블릿/데스크톱

### 필터
- 지난 7일, 30일, 90일, 1년 단위로 조회 가능

### 실시간 업데이트
- 페이지 새로고침 시 최신 데이터 로드

---

## 🔐 보안

### RLS (Row Level Security)
- **삽입**: 모두 가능 (미들웨어에서만)
- **조회**: service_role 또는 authenticated만

### 비밀번호
- 기본값: `rainbow2025`
- 변경하려면: `.env.local`에서 `NEXT_PUBLIC_ADMIN_PASSWORD` 수정

### 개인정보
- IP 주소 저장 (분석용)
- User-Agent 저장 (기기 정보 분류)
- 쿠키 사용 안 함 (GDPR 준수)

---

## 🛠️ 커스터마이징

### 비밀번호 변경
`apps/homepage/.env.local`:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=새_비밀번호
```

### 대시보드 로고 변경
`apps/homepage/src/app/admin/analytics/page.tsx`:
```tsx
<h1 className="text-3xl font-bold text-gray-900">
  📊 Analytics Dashboard  // 여기 수정
</h1>
```

### 데이터 보존 기간
Supabase SQL:
```sql
-- 90일 이상 된 데이터 삭제
DELETE FROM page_analytics
WHERE visited_at < NOW() - INTERVAL '90 days';
```

---

## 📈 예상되는 데이터

### 일일 방문자
- `visitor_id`: 고유한 방문자 ID (해시)
- `page_path`: `/`, `/about`, `/contact` 등
- `referrer`: Google, Naver, direct 등
- `device_type`: mobile, tablet, desktop
- `browser`: Chrome, Safari, Firefox 등

### 대시보드 표시
- 인기 페이지 Top 10
- 유입 경로 Top 10
- 기기별 분포 (원 그래프)
- 브라우저별 분포 (막대 그래프)

---

## ❌ 문제 해결

### "데이터가 없습니다" 표시되는 경우

1. **방문자가 없는지 확인**
   - Supabase SQL Editor에서:
   ```sql
   SELECT COUNT(*) FROM page_analytics;
   ```

2. **미들웨어가 제대로 작동하는지 확인**
   ```bash
   # 로그 확인
   tail -f .next/server/middleware.log
   ```

3. **Supabase 연결 확인**
   ```bash
   # 환경변수 확인
   cat .env.local | grep SUPABASE
   ```

### 대시보드에 접근 못하는 경우

1. 비밀번호 확인 (기본값: `rainbow2025`)
2. URL 확인: `https://rainbow-f.kr/admin/analytics`
3. 브라우저 캐시 제거

---

## 📚 참고 링크

- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Google Analytics 문서](https://support.google.com/analytics/answer/9964640)

---

## 🎉 완료!

이제 모든 방문자 데이터가 자동으로 수집되고 있습니다.

대시보드에서 실시간으로 확인하세요! 🌟
