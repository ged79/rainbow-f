// ===== ADMIN NEW ARCHITECTURE =====
// Commission-focused B2B flower delivery admin panel

## Core Principles
- 수수료 수익 극대화
- 실시간 정산 모니터링  
- 최소 기능, 최대 효율

## Directory Structure
```
admin_new/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # Shared layout with sidebar
│   │   │   ├── page.tsx         # Commission dashboard
│   │   │   ├── settlements/     # 정산 관리
│   │   │   ├── stores/          # 가맹점 승인/관리
│   │   │   └── commission/      # 수수료 설정
│   │   └── api/
│   │       ├── settlements/
│   │       └── stores/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── CommissionChart.tsx
│   │   │   ├── SettlementStatus.tsx
│   │   │   └── RevenueMetrics.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       └── StatusBadge.tsx
│   └── lib/
│       ├── admin/
│       │   ├── commission.ts    # 수수료 계산 로직
│       │   └── settlement.ts    # 정산 처리
│       └── types/
│           └── admin.ts
├── package.json
└── tsconfig.json
```

## Key Features

### 1. Dashboard (수수료 대시보드)
- 오늘/이번주/이번달 수수료 수익
- 정산 대기 금액
- 가맹점별 수수료 기여도
- 실시간 주문 수수료 트래킹

### 2. Settlements (정산 관리)
- 자동 정산 스케줄링 (일/주/월)
- 수동 정산 처리
- 정산 내역 다운로드 (Excel)
- 이의제기 처리

### 3. Store Approval (가맹점 승인)
- 신규 가맹점 심사 큐
- 수수료율 설정 (기본 25%)
- 지역별 수수료 차등 적용
- 가맹점 등급 관리

### 4. Commission Settings (수수료 관리)
- 기본 수수료율 설정
- 가맹점별 특별 요율
- 프로모션 기간 설정
- 수수료 면제 설정

## Database Schema Focus
```typescript
// 핵심 테이블
- orders (payment.commission 필드)
- settlements (정산 내역)
- point_transactions (수수료 차감 기록)
- stores (commission_rate 필드)
```

## Implementation Priority
1. ✅ Package setup & shared integration
2. ⏳ Dashboard with commission metrics
3. ⏳ Settlement processing
4. ⏳ Store approval flow