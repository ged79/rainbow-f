# 토스페이먼츠 연동 가이드

## 1. 가입 및 API 키 발급

1. https://www.tosspayments.com/ 가입
2. 개발자센터 → API 키 발급
3. 테스트 키 (개발용) 먼저 받기

## 2. 환경 변수 추가

`.env.local`에 추가:
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxx
TOSS_SECRET_KEY=test_sk_xxxxx
```

## 3. 설치

```bash
npm install @tosspayments/payment-sdk
```

## 4. 구현 파일

- `lib/payment/toss.ts` - 토스 결제 로직
- `components/TossPayment.tsx` - 결제 UI
- `api/payment/confirm/route.ts` - 결제 승인 API

준비되면 알려주세요.
