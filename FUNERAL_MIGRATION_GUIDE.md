# Funeral-app LocalStorage → Supabase 전환 가이드

## 변경 사항

### 1. 필요한 전제조건
- `funeral_home_id`가 필요 (현재 로그인한 장례식장 ID)
- 임시로 환경변수나 하드코딩 사용

### 2. AdminDashboard.tsx 수정

```typescript
// 파일 상단에 추가
import { 
  saveFuneral, 
  getFuneralsByHome, 
  getFuneralByRoom,
  deleteFuneral,
  subscribeFuneralChanges 
} from '../lib/funeralApi'

// 임시: funeral_home_id 설정 (나중에 로그인 시스템에서 가져옴)
const FUNERAL_HOME_ID = 'YOUR_FUNERAL_HOME_ID' // 실제 UUID로 교체
```

### 3. 저장 함수 수정

**기존 (LocalStorage):**
```typescript
const handleSaveRoomInfo = async () => {
  const funeralData = { ... }
  localStorage.setItem('funerals', JSON.stringify(funerals))
}
```

**변경 (Supabase):**
```typescript
const handleSaveRoomInfo = async () => {
  try {
    const roomNumber = parseInt(currentPage.split('-')[1])
    
    const funeralData = {
      funeral_home_id: FUNERAL_HOME_ID,
      room_number: roomNumber,
      deceased_name: deceasedName,
      deceased_hanja: deceasedNameHanja,
      age: deceasedAge ? parseInt(deceasedAge) : null,
      gender: deceasedGender,
      religion: religion,
      religion_title: religionTitle,
      placement_time: placementTime,
      casket_time: casketTime,
      shroud_time: shroudTime,
      funeral_time: funeralTime,
      checkout_time: checkoutTime,
      death_time: deathTime,
      placement_date: placementDate,
      burial_type: burialType,
      burial_location: burialLocation,
      burial_location_2: burialLocation2,
      death_cause: deathCause,
      death_place: deathPlace,
      chemical_treatment: chemicalTreatment,
      deceased_address: deceasedAddress,
      deceased_note: deceasedNote,
      resident_number: residentNumber,
      baptismal_name: baptismalName,
      other_title: otherTitle,
      business_note: businessNote,
      funeral_director: funeralDirector,
      funeral_company: funeralCompany,
      bank_accounts: bankAccounts.filter(a => a.bankName || a.accountNumber),
      use_photo_in_obituary: usePhotoInObituary,
      chief_message: chiefMournerMessage,
      photo_url: deceasedPhoto,
      family_members: familyMembers,
      status: 'active'
    }

    await saveFuneral(funeralData)
    alert('저장되었습니다.')
    loadAllRoomsData() // 새로고침
    
  } catch (error) {
    console.error('저장 실패:', error)
    alert('저장에 실패했습니다.')
  }
}
```

### 4. 불러오기 함수 수정

**기존 (LocalStorage):**
```typescript
const loadAllRoomsData = () => {
  const savedFunerals = localStorage.getItem('funerals')
  const funerals = JSON.parse(savedFunerals)
  // ...
}
```

**변경 (Supabase):**
```typescript
const loadAllRoomsData = async () => {
  try {
    const funerals = await getFuneralsByHome(FUNERAL_HOME_ID)
    const roomData: any = {}
    
    funerals.forEach((funeral: any) => {
      const roomKey = `room-${funeral.room_number}`
      roomData[roomKey] = funeral
    })
    
    setRoomFunerals(roomData)
    
    // 방 상태 업데이트
    const updatedRooms = mockRooms.map(room => {
      const roomKey = `room-${room.id}`
      const hasData = roomData[roomKey]
      return {
        ...room,
        status: hasData ? 'occupied' : 'available'
      }
    })
    setRooms(updatedRooms)
    
  } catch (error) {
    console.error('데이터 불러오기 실패:', error)
  }
}
```

### 5. 특정 빈소 불러오기

**변경 (Supabase):**
```typescript
const loadRoomData = async (roomId: string) => {
  try {
    const roomNumber = parseInt(roomId.split('-')[1])
    const roomData = await getFuneralByRoom(FUNERAL_HOME_ID, roomNumber)
    
    if (roomData) {
      // 모든 필드 설정
      setDeceasedName(roomData.deceased_name || '')
      setDeceasedNameHanja(roomData.deceased_hanja || '')
      // ... 나머지 필드들
    } else {
      resetFormSilently()
    }
  } catch (error) {
    console.error('데이터 불러오기 실패:', error)
  }
}
```

### 6. 퇴실 처리

**변경:**
```typescript
const handleCheckOut = async (roomId: number) => {
  if (confirm('퇴실 처리하시겠습니까?')) {
    try {
      const roomKey = `room-${roomId}`
      const funeral = roomFunerals[roomKey]
      
      if (funeral?.id) {
        await deleteFuneral(funeral.id)
        // 또는 상태만 변경: await completeFuneral(funeral.id)
      }
      
      loadAllRoomsData() // 새로고침
    } catch (error) {
      console.error('퇴실 처리 실패:', error)
    }
  }
}
```

### 7. Real-time 구독 (선택)

```typescript
useEffect(() => {
  const subscription = subscribeFuneralChanges(
    FUNERAL_HOME_ID,
    (payload) => {
      console.log('빈소 변경:', payload)
      loadAllRoomsData() // 자동 새로고침
    }
  )
  
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

## 주요 변경점 요약

1. ✅ `localStorage.getItem` → `getFuneralsByHome()`
2. ✅ `localStorage.setItem` → `saveFuneral()`
3. ✅ `room_id: 'room-1'` → `room_number: 1`
4. ✅ 모든 async 함수로 변경
5. ✅ try-catch 에러 처리 추가

## 다음 단계

funeral_home_id를 실제로 가져오려면:
1. 로그인 시스템 구축
2. 세션에서 funeral_home_id 추출

일단 테스트용으로 하드코딩하여 진행하시겠습니까?
