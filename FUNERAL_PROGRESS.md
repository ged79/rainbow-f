# Funeral-App Supabase 연동 현황

## ✅ 완료된 작업

### 1. 데이터베이스
- `funeral_homes` 테이블 생성
- `funeral_users` 테이블 생성  
- `funerals` 테이블 생성 (30+ 필드)
- RLS 정책 적용
- Admin 계정 설정 완료

### 2. Admin
- 장례식장 등록 기능 작동
- funeral_home_id: `fbb39ae7-b5f7-465c-a4f7-592da93642b7`

### 3. Funeral-app
- 로그인 페이지 생성 (admin/1111)
- API 함수 작성 (`funeralApi.ts`)
- Supabase 연동 함수 준비 완료

## 🔄 남은 작업

### AdminDashboard.tsx 수정
파일이 매우 크므로 단계별 수정:

1. **파일 상단에 import 추가**
```typescript
import { 
  saveFuneral, 
  getFuneralsByHome, 
  getFuneralByRoom,
  deleteFuneral 
} from '../lib/funeralApi'
```

2. **기존 LocalStorage 함수 교체**
- `loadAllRoomsData` → Supabase
- `loadRoomData` → Supabase
- `handleSaveRoomInfo` → Supabase
- `handleCheckOut` → Supabase
- `loadSavedFuneralsList` → Supabase

교체할 함수들은 `ADMIN_DASHBOARD_SUPABASE_FUNCTIONS.tsx`에 준비됨.

## 📝 다음 단계

1. AdminDashboard.tsx 열기
2. ADMIN_DASHBOARD_SUPABASE_FUNCTIONS.tsx 내용 복사
3. 기존 함수들 교체
4. 테스트

**작업 계속하시겠습니까?**
