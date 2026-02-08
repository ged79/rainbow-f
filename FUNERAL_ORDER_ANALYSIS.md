# 장례 화환 주문 연동 분석

## 현재 시스템 구조

### Funeral-app
- **주문 API**: `/app/api/orders/route.ts`
- **테이블**: `customer_orders` 사용
- **주요 필드**: `funeral_data` (JSON) - deceased_name, mourner_info 등 포함

### Homepage
- **주문 API**: `/src/app/api/orders/route.ts`
- **테이블**: `customer_orders` 사용 (동일 테이블)
- **리다이렉트**: funeral/flower → homepage/order?id={productId}&funeral=true

## 문제점
1. Homepage 주문 시 funeral_home_id, room_number 저장 안됨
2. 부고장에서 해당 빈소 화환 조회 불가능

## 해결 방안

### 1단계: customer_orders 테이블 확인
```sql
-- 기존 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_orders';
```

### 2단계: Homepage 주문 수정
**파일**: `homepage/src/app/api/orders/route.ts`

수정 위치: POST 함수 내 주문 생성 부분
```typescript
const { data: order, error } = await supabaseAdmin
  .from('customer_orders')
  .insert({
    // 기존 필드...
    funeral_home_id: body.funeral_home_id || null,  // 추가
    room_number: body.room_number || null,          // 추가
    // ...
  })
```

### 3단계: Funeral flower page 수정
**파일**: `funeral-app/app/obituary/flower/page.tsx`

```typescript
const handleOrderClick = (productId: string) => {
  const obituaryData = sessionStorage.getItem('obituaryPreview')
  const parsed = obituaryData ? JSON.parse(obituaryData) : {}
  
  // funeral_home_id 가져오기
  const funeralHomeId = sessionStorage.getItem('funeral_home_id')
  
  // room_number 추출 (예: "room-1" → 1)
  const roomMatch = parsed?.room?.match(/(\d+)/)
  const roomNumber = roomMatch ? parseInt(roomMatch[1]) : null
  
  const url = `${homepageUrl}/order?id=${productId}&autoOrder=true&funeral=true` +
    `&funeral_home_id=${funeralHomeId}` +
    `&room_number=${roomNumber}` +
    `&room=${encodeURIComponent(parsed?.room)}` +
    `&deceased=${encodeURIComponent(parsed?.deceasedName)}`
  
  window.location.href = url
}
```

### 4단계: 부고장에서 조회
**파일**: `funeral-app/app/obituary/modern/page.tsx`

```typescript
const loadFuneralOrders = async () => {
  const funeralHomeId = sessionStorage.getItem('funeral_home_id')
  const obituaryData = sessionStorage.getItem('obituaryPreview')
  const parsed = JSON.parse(obituaryData || '{}')
  const roomMatch = parsed?.room?.match(/(\d+)/)
  const roomNumber = roomMatch ? parseInt(roomMatch[1]) : null
  
  const { data, error } = await supabase
    .from('customer_orders')
    .select('*')
    .eq('funeral_home_id', funeralHomeId)
    .eq('room_number', roomNumber)
    .order('created_at', { ascending: false })
  
  return data || []
}
```

## 주의사항
- customer_orders 테이블은 매출/정산과 직결
- 기존 주문 데이터 영향 없도록 NULL 허용
- Homepage 주문 프로세스 철저히 테스트 필요
