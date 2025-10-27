// AdminDashboard 상단에 추가할 import와 함수들

import { 
  saveFuneral, 
  getFuneralsByHome, 
  getFuneralByRoom,
  deleteFuneral 
} from '../lib/funeralApi'

// funeral_home_id 가져오기
const getFuneralHomeId = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('funeral_home_id') || '';
  }
  return '';
};

// ===== LocalStorage 함수들을 Supabase로 교체 =====

// 1. loadAllRoomsData - Supabase 버전
const loadAllRoomsData = async () => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;

    const funerals = await getFuneralsByHome(funeralHomeId);
    const roomData: any = {};
    
    funerals.forEach((funeral: any) => {
      const roomKey = `room-${funeral.room_number}`;
      roomData[roomKey] = funeral;
    });
    
    setRoomFunerals(roomData);
    
    const updatedRooms = mockRooms.map(room => {
      const roomKey = `room-${room.id}`;
      const hasData = roomData[roomKey];
      return {
        ...room,
        status: hasData ? 'occupied' : 'available'
      };
    });
    setRooms(updatedRooms);
    
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
    alert('데이터를 불러오는데 실패했습니다.');
  }
};

// 2. loadRoomData - Supabase 버전
const loadRoomData = async (roomId: string) => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;

    const roomNumber = parseInt(roomId.split('-')[1]);
    const roomData = await getFuneralByRoom(funeralHomeId, roomNumber);
    
    if (roomData) {
      setDeceasedName(roomData.deceased_name || '');
      setDeceasedNameHanja(roomData.deceased_hanja || '');
      setDeceasedAge(roomData.age?.toString() || '');
      setDeceasedGender(roomData.gender || '');
      setReligion(roomData.religion || '');
      setReligionTitle(roomData.religion_title || '');
      setPlacementTime(roomData.placement_time || '');
      setCasketTime(roomData.casket_time || '');
      setShroudTime(roomData.shroud_time || '');
      setFuneralTime(roomData.funeral_time || '');
      setCheckoutTime(roomData.checkout_time || '');
      setDeathTime(roomData.death_time || '');
      setPlacementDate(roomData.placement_date || '');
      setBurialType(roomData.burial_type || '');
      setBurialLocation(roomData.burial_location || '');
      setBurialLocation2(roomData.burial_location_2 || '');
      setDeathCause(roomData.death_cause || '');
      setDeathPlace(roomData.death_place || '');
      setChemicalTreatment(roomData.chemical_treatment || '');
      setDeceasedAddress(roomData.deceased_address || '');
      setDeceasedNote(roomData.deceased_note || '');
      setResidentNumber(roomData.resident_number || '');
      setBaptismalName(roomData.baptismal_name || '');
      setOtherTitle(roomData.other_title || '');
      setBusinessNote(roomData.business_note || '');
      setFuneralDirector(roomData.funeral_director || '');
      setFuneralCompany(roomData.funeral_company || '');
      setBankAccounts(roomData.bank_accounts || [{ id: 1, bankName: '', accountNumber: '', accountHolder: '' }]);
      setUsePhotoInObituary(roomData.use_photo_in_obituary !== undefined ? roomData.use_photo_in_obituary : true);
      setChiefMournerMessage(roomData.chief_message || '');
      setDeceasedPhoto(roomData.photo_url || null);
      if (roomData.family_members && roomData.family_members.length > 0) {
        setFamilyMembers(roomData.family_members);
      }
    } else {
      resetFormSilently();
    }
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
  }
};

// 3. handleSaveRoomInfo - Supabase 버전
const handleSaveRoomInfo = async () => {
  if (!deceasedName) {
    alert('고인 이름은 필수 입력 항목입니다.');
    return;
  }

  const funeralHomeId = getFuneralHomeId();
  if (!funeralHomeId) {
    alert('로그인이 필요합니다.');
    return;
  }

  try {
    const roomNumber = parseInt(currentPage.split('-')[1]);
    
    const funeralData = {
      funeral_home_id: funeralHomeId,
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
      bank_accounts: bankAccounts.filter(a => a.bankName || a.accountNumber || a.accountHolder),
      use_photo_in_obituary: usePhotoInObituary,
      chief_message: chiefMournerMessage,
      photo_url: deceasedPhoto,
      family_members: familyMembers,
      status: 'active'
    };

    await saveFuneral(funeralData);
    alert('저장되었습니다.');
    loadAllRoomsData();
    
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  }
};

// 4. handleCheckOut - Supabase 버전
const handleCheckOut = async (roomId: number) => {
  if (confirm('퇴실 처리하시겠습니까?')) {
    try {
      const funeralHomeId = getFuneralHomeId();
      if (!funeralHomeId) return;

      const funeral = await getFuneralByRoom(funeralHomeId, roomId);
      
      if (funeral?.id) {
        await deleteFuneral(funeral.id);
        alert('퇴실 처리되었습니다.');
        loadAllRoomsData();
      }
    } catch (error) {
      console.error('퇴실 처리 실패:', error);
      alert('퇴실 처리에 실패했습니다.');
    }
  }
};

// 5. loadSavedFuneralsList - Supabase 버전
const loadSavedFuneralsList = async () => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;

    const funerals = await getFuneralsByHome(funeralHomeId);
    setSavedFuneralsList(funerals);
  } catch (error) {
    console.error('목록 불러오기 실패:', error);
  }
};
