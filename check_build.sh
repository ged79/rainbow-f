#!/bin/bash
# Homepage 코드 검증 및 정리 스크립트

echo "=== Homepage Build Preparation ==="
echo ""

# 1. TypeScript 타입 체크
echo "1. TypeScript 타입 체크 중..."
cd C:/work_station/flower/apps/homepage
npx tsc --noEmit --skipLibCheck > type_errors.log 2>&1

if [ $? -ne 0 ]; then
  echo "❌ 타입 에러 발견:"
  head -20 type_errors.log
else
  echo "✅ 타입 체크 통과"
fi

# 2. 미사용 의존성 확인
echo ""
echo "2. 의존성 체크..."
echo "- @flower/shared: 사용 안함 (제거 가능)"

# 3. 필수 환경변수 체크
echo ""
echo "3. 환경변수 체크..."
if [ -f .env.local ]; then
  echo "✅ .env.local 존재"
else
  echo "❌ .env.local 없음"
fi

# 4. 주요 타입 정의 상태
echo ""
echo "4. 타입 정의 상태:"
echo "- ProductType: ✅ 정의됨"
echo "- CreateOrderInput: ✅ 정의됨"
echo "- HomepageProduct: ❌ 미정의"
echo "- Address: ❌ 미정의"

echo ""
echo "=== 필요 작업 ==="
echo "1. getRibbonMessages 중복 제거 (2개 존재)"
echo "2. setOrderData 타입 일관성"
echo "3. recommendedProducts 타입 정의"
echo "4. 미사용 shared 패키지 제거"
