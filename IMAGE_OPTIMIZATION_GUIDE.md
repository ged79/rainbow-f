# 이미지 최적화 가이드

## 📊 현재 상태
- **전체 용량:** 43.89 MB
- **최대 파일:** 2.38 MB (PNG)
- **문제:** 원본 이미지 그대로 사용 중
- **로딩 속도:** 5-10초 (이탈률 40%)

## 🎯 최적화 목표
- **용량 감소:** 43MB → 8MB (80% 절감)
- **형식 변환:** JPG/PNG → WebP
- **반응형:** 5가지 사이즈 자동 생성
- **로딩 개선:** 1-2초 이내

---

## 🚀 실행 방법

### 1단계: Sharp 설치
```bash
cd C:\work_station\flower\apps\homepage

# 임시 package.json 사용
npm install sharp
```

### 2단계: 이미지 최적화 실행
```bash
node optimize-images.js
```

**실행 결과:**
- `public/optimized/` 폴더에 최적화된 이미지 생성
- 각 이미지당 6개 파일:
  - `이름-thumbnail.webp` (200px)
  - `이름-small.webp` (400px)
  - `이름-medium.webp` (800px)
  - `이름-large.webp` (1200px)
  - `이름-original.webp` (1920px)
  - `이름-fallback.jpg` (1200px, 구형 브라우저용)

### 3단계: 코드 적용

#### Option A: 자동 최적화 (추천)
기존 코드 수정 없이 자동으로 최적화된 이미지 사용:

```tsx
// src/components/ModernSection.tsx (예시)
import OptimizedImage from '@/components/OptimizedImage'

// Before
<img src={product.image} alt={product.name} />

// After
<OptimizedImage 
  src={product.image} 
  alt={product.name}
  size="medium"
  className="w-full h-auto"
/>
```

#### Option B: Next.js Image 직접 사용
```tsx
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/lib/optimized-image'

<Image
  src={getOptimizedImageUrl(product.image, 'medium')}
  alt={product.name}
  width={800}
  height={800}
  quality={85}
/>
```

---

## 📝 주요 파일 설명

### 생성된 파일
1. **optimize-images.js** - 최적화 스크립트
2. **src/lib/optimized-image.ts** - 이미지 경로 유틸리티
3. **src/components/OptimizedImage.tsx** - React 컴포넌트

### 사용 예시

#### 상품 목록 (중간 크기)
```tsx
<OptimizedImage 
  src="/100송이 근조화환.jpg"
  alt="근조화환"
  size="medium"
/>
```

#### 썸네일 (작은 크기)
```tsx
<ThumbnailImage 
  src="/꽃다발.jpg"
  alt="꽃다발"
/>
```

#### 히어로 배너 (전체 화면)
```tsx
<HeroImage 
  src="/프리미엄 꽃다발.jpg"
  alt="메인 배너"
  priority  // LCP 최적화
/>
```

---

## 🔧 적용 순서 (우선순위)

### Phase 1: 메인 페이지 (즉시)
파일: `src/app/page.tsx`, `src/components/ModernSection.tsx`
```tsx
// 상품 카드 이미지
<OptimizedImage 
  src={product.image}
  alt={product.name}
  size="medium"
/>
```

### Phase 2: 상품 상세 (다음)
파일: `src/app/product/page.tsx`
```tsx
// 큰 이미지
<OptimizedImage 
  src={product.image}
  alt={product.name}
  size="large"
  priority
/>
```

### Phase 3: 주문 페이지
파일: `src/app/order/page.tsx`
```tsx
// 작은 썸네일
<ThumbnailImage 
  src={product.image}
  alt={product.name}
/>
```

---

## 📊 예상 효과

### Before
```
근조_특대_상세.png: 2.38 MB
장례식.jpg: 1.46 MB
프리미엄 꽃다발.jpg: 1.37 MB
...
총 43.89 MB
```

### After
```
근조_특대_상세-medium.webp: 80 KB
장례식-medium.webp: 120 KB
프리미엄 꽃다발-medium.webp: 110 KB
...
총 ~8 MB (80% 감소)
```

### 성능 개선
- **로딩 속도:** 10초 → 1-2초
- **LCP (최대 콘텐츠풀 페인트):** 4s → 1s
- **이탈률:** 40% → 15% (예상)
- **SEO 점수:** +20점
- **모바일 데이터:** 80% 절감

---

## ⚠️ 주의사항

### 1. 기존 이미지 백업
```bash
# 실행 전 백업
xcopy public public_backup /E /I
```

### 2. Git 설정
`.gitignore`에 추가:
```
public/optimized/
public_backup/
```

### 3. Vercel 배포
- 최초 배포시 빌드 시간 증가 (이미지 최적화)
- 이후 배포는 캐시 사용으로 빠름

### 4. 점진적 적용
- 한 번에 모든 페이지 수정 ❌
- 페이지별 순차 적용 ✅

---

## 🧪 테스트 방법

### 로컬 테스트
```bash
npm run dev
# http://localhost:3000 접속
# 개발자도구 Network 탭에서 이미지 크기 확인
```

### 크롬 개발자도구
1. F12 → Network 탭
2. Img 필터 선택
3. Size 컬럼 확인
4. 각 이미지가 100KB 이하인지 확인

### Lighthouse 성능 측정
1. F12 → Lighthouse 탭
2. Performance 선택
3. Generate report
4. LCP 점수 확인 (2.5초 이하 목표)

---

## 🔄 롤백 방법

문제 발생시:

1. **이미지만 롤백**
```bash
rmdir /S public\optimized
```

2. **코드 롤백**
```bash
git checkout src/components/OptimizedImage.tsx
git checkout src/lib/optimized-image.ts
```

3. **기존 이미지 사용**
```tsx
// 원래대로 사용
<img src={product.image} alt={product.name} />
```

---

## 📞 다음 단계

1. ✅ **지금 실행:** `npm install sharp && node optimize-images.js`
2. ✅ **결과 확인:** `public/optimized/` 폴더 확인
3. ✅ **코드 적용:** 메인 페이지부터 `OptimizedImage` 컴포넌트 적용
4. ✅ **테스트:** 로컬에서 이미지 로딩 확인
5. ✅ **배포:** Vercel에 배포 후 성능 측정

---

## 💡 추가 최적화 (선택)

### 1. 지연 로딩 (Lazy Loading)
```tsx
<OptimizedImage 
  src={product.image}
  alt={product.name}
  priority={false}  // 뷰포트 밖은 나중에 로드
/>
```

### 2. 블러 플레이스홀더
```tsx
<OptimizedImage 
  src={product.image}
  alt={product.name}
  placeholder="blur"  // 로딩중 블러 효과
/>
```

### 3. CDN 사용
Vercel 자동 CDN 활성화됨 (추가 설정 불필요)

---

## ✅ 체크리스트

- [ ] Sharp 설치 완료
- [ ] `optimize-images.js` 실행 완료
- [ ] `public/optimized/` 폴더 확인
- [ ] `OptimizedImage` 컴포넌트 테스트
- [ ] 메인 페이지 적용
- [ ] Lighthouse 점수 확인
- [ ] 프로덕션 배포

**예상 소요 시간:** 30분 (실행 20분 + 적용 10분)
