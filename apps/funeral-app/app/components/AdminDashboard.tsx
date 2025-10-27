'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Settings, FileText, Calendar, MapPin } from 'lucide-react';
import { saveFuneral, getFuneralsByHome, getFuneralByRoom, deleteFuneral } from '../lib/funeralApi';

const mockRooms = [
  { id: 1, name: '1빈소', floor: '2층', status: 'available' },
  { id: 2, name: '2빈소', floor: '2층', status: 'available' },
  { id: 3, name: '3빈소', floor: '3층', status: 'available' },
  { id: 4, name: '4빈소', floor: '3층', status: 'available' },
  { id: 5, name: '특실 5빈소', floor: '5층', status: 'available' },
  { id: 6, name: '예비', floor: '', status: 'available' },
];

const getFuneralHomeId = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('funeral_home_id') || '';
  }
  return '';
};

export default function AdminDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('현황판');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [placementTime, setPlacementTime] = useState('2025-10-04 10:19');
  const [funeralTime, setFuneralTime] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [casketTime, setCasketTime] = useState('');
  const [shroudTime, setShroudTime] = useState(''); // 염습일시 추가
  const [deathTime, setDeathTime] = useState(''); // 사망일시 추가
  const [religion, setReligion] = useState('');
  const [religionTitle, setReligionTitle] = useState('');
  const [placementDate, setPlacementDate] = useState(''); // 안치일시
  const [rooms, setRooms] = useState(mockRooms);
  const [selectedMoveRoom, setSelectedMoveRoom] = useState('');
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, relation: '', name: '', phone: '' }
  ]);
  const [deceasedNameHanja, setDeceasedNameHanja] = useState('');
  const [chiefMournerMessage, setChiefMournerMessage] = useState('');
  const [deceasedPhoto, setDeceasedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [burialType, setBurialType] = useState<'burial' | 'cremation' | ''>('');
  const [deceasedName, setDeceasedName] = useState(''); // 고인이름 추가
  const [deceasedAge, setDeceasedAge] = useState(''); // 고인나이 추가
  const [deceasedGender, setDeceasedGender] = useState(''); // 고인성별 추가
  const [burialLocation, setBurialLocation] = useState(''); // 장지 추가
  const [burialLocation2, setBurialLocation2] = useState(''); // 2차장지 추가
  const [savedFuneralsList, setSavedFuneralsList] = useState<any[]>([]); // 저장된 장례 목록
  const [roomFunerals, setRoomFunerals] = useState<any>({});
  const [deathCause, setDeathCause] = useState(''); // 사망원인
  const [deathPlace, setDeathPlace] = useState(''); // 사망장소
  const [chemicalTreatment, setChemicalTreatment] = useState(''); // 약품처리
  const [deceasedAddress, setDeceasedAddress] = useState(''); // 고인주소
  const [deceasedNote, setDeceasedNote] = useState(''); // 고인비고
  const [residentNumber, setResidentNumber] = useState(''); // 주민번호
  const [baptismalName, setBaptismalName] = useState(''); // 세례명
  const [otherTitle, setOtherTitle] = useState(''); // 기타대우
  const [businessNote, setBusinessNote] = useState(''); // 업무비고
  const [funeralDirector, setFuneralDirector] = useState(''); // 장례지도사
  const [funeralCompany, setFuneralCompany] = useState(''); // 장례주관
  const [bankAccounts, setBankAccounts] = useState([
    { id: 1, bankName: '', accountNumber: '', accountHolder: '' }
  ]);
  const [usePhotoInObituary, setUsePhotoInObituary] = useState(true); // 모바일부고장 사진사용 여부

  // 빈소 변경 시 저장된 데이터 불러오기
  useEffect(() => {
    if (currentPage.startsWith('room-')) {
      loadRoomData(currentPage);
    }
    // 저장된 장례 목록도 업데이트
    loadSavedFuneralsList();
  }, [currentPage]);

  // 초기 로드시 모든 방 데이터 불러오기
  useEffect(() => {
    loadAllRoomsData();
  }, []);

  // 모든 방의 데이터 불러오기
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
      return { ...room, status: hasData ? 'occupied' : 'available' };
    });
    setRooms(updatedRooms);
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
    alert('데이터를 불러오는데 실패했습니다.');
  }
};

  // 저장된 모든 장례 목록 불러오기
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

  // 빈소 데이터 불러오기
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

  // 종교별 심볼 반환 함수
  const getReligionSymbol = (religion: string) => {
    switch(religion) {
      case '기독교':
      case '천주교':
        return '✝';
      case '불교':
        return '卍';
      case '원불교':  
        return '◉';
      case '유교':
        return '⚊';
      case '무교':
      default:
        return '';
    }
  };

  // 날짜 포맷 변환 함수
  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return '시간미정';
    
    try {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = dayNames[date.getDay()];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      let timeStr = '';
      if (hours !== 0 || minutes !== 0) {
        const period = hours < 12 ? '오전' : '오후';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        timeStr = ` ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
      }
      
      return `${month}월 ${day}일 (${dayOfWeek})${timeStr}`;
    } catch (e) {
      return dateStr;
    }
  };

  // 완료된 장례 목록 (임시 데이터)
  const [completedFunerals, setCompletedFunerals] = useState([
    {
      id: 1,
      deceasedName: '홍길동',
      age: 75,
      room: '1빈소',
      placementDate: '2025-01-15',
      funeralDate: '2025-01-18',
      chiefMourner: '홍철수',
      phone: '010-1234-5678'
    },
    {
      id: 2,
      deceasedName: '김영희',
      age: 82,
      room: '3빈소',
      placementDate: '2025-01-10',
      funeralDate: '2025-01-13',
      chiefMourner: '김민수',
      phone: '010-8765-4321'
    }
  ]);

  // 한국 시간으로 포맷팅
  const formatToKST = (date: Date): string => {
    const kstOffset = 9 * 60;
    const localDate = new Date(date.getTime() + kstOffset * 60 * 1000);
    return localDate.toISOString().slice(0, 16).replace('T', ' ');
  };

  // 현재 시간을 입실시간에 설정
  const setCurrentTime = () => {
    const now = new Date();
    const formattedTime = formatToKST(now);
    setPlacementTime(formattedTime);
    setPlacementDate(formattedTime); // 안치일시도 동일하게 설정
  };

  // 종교별 호칭 매핑
  const religionTitles: { [key: string]: string[] } = {
    '불교': ['법명', '법호'],
    '기독교': ['세례명', '성도', '권사', '집사', '장로'],
    '천주교': ['세례명', '영명'],
    '원불교': ['법명'],
    '유교': ['시호'],
    '무교': []
  };

  // 종교별 별세 표현
  const religionDeathTerms: { [key: string]: string } = {
    '불교': '입적',
    '기독교': '소천',
    '천주교': '선종',
    '원불교': '법신귀일',
    '유교': '별세',
    '무교': '별세'
  };

  const handleReligionChange = (selectedReligion: string) => {
    setReligion(selectedReligion);
    setReligionTitle(''); // 종교 변경 시 호칭 초기화
  };

  // 부의금 계좌 추가
  const addBankAccount = () => {
    const newId = Math.max(...bankAccounts.map(a => a.id)) + 1;
    setBankAccounts([...bankAccounts, { id: newId, bankName: '', accountNumber: '', accountHolder: '' }]);
  };

  // 부의금 계좌 삭제
  const removeBankAccount = (id: number) => {
    if (bankAccounts.length > 1) {
      setBankAccounts(bankAccounts.filter(a => a.id !== id));
    }
  };

  // 부의금 계좌 업데이트
  const updateBankAccount = (id: number, field: string, value: string) => {
    setBankAccounts(bankAccounts.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // 유가족 추가
  const addFamilyMember = () => {
    const newId = Math.max(...familyMembers.map(m => m.id)) + 1;
    setFamilyMembers([...familyMembers, { id: newId, relation: '', name: '', phone: '' }]);
  };

  // 유가족 삭제
  const removeFamilyMember = (id: number) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter(m => m.id !== id));
    }
  };

  // 유가족 정보 업데이트
  const updateFamilyMember = (id: number, field: string, value: string) => {
    setFamilyMembers(familyMembers.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // 가족 서열 정렬 함수
  const getSortedFamilyMembers = () => {
    const relationOrder: { [key: string]: number } = {
      '상주': 1,
      '배우자': 2,
      '아들': 3,
      '며느리': 4,
      '딸': 5,
      '사위': 6,
      '손자': 7,
      '손녀': 8,
      '형제': 9,
      '자매': 10,
    };

    return [...familyMembers].sort((a, b) => {
      const orderA = relationOrder[a.relation] || 999;
      const orderB = relationOrder[b.relation] || 999;
      return orderA - orderB;
    });
  };

  // 빈소 입실 처리
  const handleCheckIn = (roomId: number) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, status: 'occupied' } : room
    ));
  };

  // 빈소 퇴실 처리
const handleCheckOut = async (roomId: number) => {
  if (confirm('퇴실 처리하시겠습니까?')) {
    try {
      const funeralHomeId = getFuneralHomeId();
      if (!funeralHomeId) return;
      const funeral = await getFuneralByRoom(funeralHomeId, roomId);
      if (funeral?.id) {
        await deleteFuneral(funeral.id);
        alert('퇴실 처리되었습니다.');
        await loadAllRoomsData();
      }
    } catch (error) {
      console.error('퇴실 처리 실패:', error);
      alert('퇴실 처리에 실패했습니다.');
    }
  }
};

  // 빈소 이동 처리
const handleMoveRoom = async (currentRoomId: number) => {
  if (!selectedMoveRoom) {
    alert('이동할 빈소를 선택해주세요.');
    return;
  }
  const funeralHomeId = getFuneralHomeId();
  if (!funeralHomeId) {
    alert('로그인이 필요합니다.');
    return;
  }
  try {
    const targetRoomId = parseInt(selectedMoveRoom);
    const targetRoom = rooms.find(r => r.id === targetRoomId);
    const targetFuneral = await getFuneralByRoom(funeralHomeId, targetRoomId);
    if (targetFuneral) {
      alert('해당 빈소는 이미 사용중입니다.');
      return;
    }
    const currentFuneral = await getFuneralByRoom(funeralHomeId, currentRoomId);
    if (!currentFuneral) {
      alert('이동할 장례 정보를 찾을 수 없습니다.');
      return;
    }
    const updatedData = { ...currentFuneral, room_number: targetRoomId };
    await saveFuneral(updatedData);
    setRooms(prev => prev.map(room => {
      if (room.id === currentRoomId) return { ...room, status: 'available' };
      if (room.id === targetRoomId) return { ...room, status: 'occupied' };
      return room;
    }));
    setCurrentPage(`room-${targetRoomId}`);
    setSelectedMoveRoom('');
    alert(`${targetRoom?.name}으로 이동했습니다.`);
    await loadAllRoomsData();
  } catch (error) {
    console.error('빈소 이동 실패:', error);
    alert('빈소 이동에 실패했습니다.');
  }
};

  // 빈소 정보 저장
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
      status: 'active' as const
    };
    await saveFuneral(funeralData);
    alert('저장되었습니다.');
    await loadAllRoomsData();
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  }
};
  // 사진 업로드 핸들러
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      setPhotoFile(file);
      
      // 미리보기를 위한 FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeceasedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 사진 삭제 핸들러
  const handlePhotoRemove = () => {
    if (confirm('사진을 삭제하시겠습니까?')) {
      setDeceasedPhoto(null);
      setPhotoFile(null);
    }
  };

  // 폼 초기화 (확인 없이)
  const resetFormSilently = () => {
    setPlacementTime('');
    setFuneralTime('');
    setCasketTime('');
    setDeathTime('');
    setReligion('');
    setReligionTitle('');
    setFamilyMembers([{ id: 1, relation: '', name: '', phone: '' }]);
    setDeceasedNameHanja('');
    setChiefMournerMessage('');
    setDeceasedPhoto(null);
    setPhotoFile(null);
    setCheckoutTime('');
    setBurialType('');
    setShroudTime('');
    setDeceasedName('');
    setDeceasedAge('');
    setDeceasedGender('');
    setBurialLocation('');
    setBurialLocation2('');
    setDeathCause('');
    setDeathPlace('');
    setChemicalTreatment('');
    setDeceasedAddress('');
    setDeceasedNote('');
    setResidentNumber('');
    setBaptismalName('');
    setOtherTitle('');
    setBusinessNote('');
    setFuneralDirector('');
    setFuneralCompany('');
    setBankAccounts([{ id: 1, bankName: '', accountNumber: '', accountHolder: '' }]);
    setUsePhotoInObituary(true);
  };

  // 초기화 (확인 포함)
  const handleReset = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setPlacementTime('');
      setFuneralTime('');
      setCasketTime('');
      setDeathTime('');
      setReligion('');
      setReligionTitle('');
      setFamilyMembers([{ id: 1, relation: '', name: '', phone: '' }]);
      setDeceasedNameHanja('');
      setChiefMournerMessage('');
      setDeceasedPhoto(null);
      setPhotoFile(null);
      setCheckoutTime('');
      setBurialType('');
      setShroudTime('');
      setDeceasedName('');
      setDeceasedAge('');
      setDeceasedGender('');
      setBurialLocation('');
      setBurialLocation2('');
      setDeathCause('');
      setDeathPlace('');
      setChemicalTreatment('');
      setDeceasedAddress('');
      setDeceasedNote('');
      setResidentNumber('');
      setBaptismalName('');
      setOtherTitle('');
      setBusinessNote('');
      setFuneralDirector('');
      setFuneralCompany('');
      setBankAccounts([{ id: 1, bankName: '', accountNumber: '', accountHolder: '' }]);
      setUsePhotoInObituary(true);
    }
  };

  const tabs = ['현황판', '지난상가', '공지사항', '화장예약'];
  const roomMenuItems = [
    { id: 'room-1', label: '1빈소 (2층)' },
    { id: 'room-2', label: '2빈소 (2층)' },
    { id: 'room-3', label: '3빈소 (3층)' },
    { id: 'room-4', label: '4빈소 (3층)' },
    { id: 'room-5', label: '특실 5빈소 (5층)' },
  ];

  const calculateFuneralDate = (days: number) => {
    // 사망일시가 없으면 입실시간을 기준으로 사용
    const baseTime = deathTime || placementTime;
    if (!baseTime) return;
    
    const date = new Date(baseTime);
    date.setDate(date.getDate() + days); // 사망일 + n일
    date.setHours(7, 0, 0, 0);
    const formattedFuneralTime = formatToKST(date);
    setFuneralTime(formattedFuneralTime);
    setCheckoutTime(formattedFuneralTime); // 퇴실시간도 동일하게 설정
    
    // 입관시간 자동 계산 (발인 전날 오후 2시)
    const casketDate = new Date(date);
    casketDate.setDate(casketDate.getDate() - 1);
    casketDate.setHours(14, 0, 0, 0);
    const formattedCasketTime = formatToKST(casketDate);
    setCasketTime(formattedCasketTime);
    
    // 염습시간 자동 계산 (입관 3시간 전, 오전 11시)
    const shroudDate = new Date(casketDate);
    shroudDate.setHours(11, 0, 0, 0);
    setShroudTime(formatToKST(shroudDate));
  };

  const renderTabHeader = () => (
    <div className="bg-white border-b">
      <div className="flex">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold ${activeTab === tab ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-600'}`}>{tab}</button>
        ))}
      </div>
    </div>
  );

  const renderSavedFunerals = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">저장된 장례 정보</h2>
        <button 
          onClick={() => loadSavedFuneralsList()} 
          className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
        >
          새로고침
        </button>
      </div>
      
      {savedFuneralsList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          저장된 장례 정보가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {savedFuneralsList.map((funeral, index) => (
            <div key={funeral.id || index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-6">
                  {/* 사진 */}
                  {funeral.photo_url && (
                    <div className="w-24 h-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img src={funeral.photo_url} alt="영정사진" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  {/* 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-800">{funeral.deceased_name || '이름 없음'}</h3>
                      {funeral.deceased_hanja && (
                        <span className="text-gray-500">({funeral.deceased_hanja})</span>
                      )}
                      {funeral.age && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">향년 {funeral.age}세</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {funeral.religion && (
                        <div>
                          <span className="text-gray-500">종교:</span>
                          <span className="ml-2 font-medium">{funeral.religion} {funeral.religion_title}</span>
                        </div>
                      )}
                      {funeral.room_id && (
                        <div>
                          <span className="text-gray-500">빈소:</span>
                          <span className="ml-2 font-medium">{funeral.room_id.replace('room-', '') + '빈소'}</span>
                        </div>
                      )}
                      {funeral.placement_time && (
                        <div>
                          <span className="text-gray-500">입실:</span>
                          <span className="ml-2 font-medium">{funeral.placement_time}</span>
                        </div>
                      )}
                      {funeral.funeral_time && (
                        <div>
                          <span className="text-gray-500">발인:</span>
                          <span className="ml-2 font-medium text-red-600">{funeral.funeral_time}</span>
                        </div>
                      )}
                      {funeral.burial_type && (
                        <div>
                          <span className="text-gray-500">장례:</span>
                          <span className="ml-2 font-medium">{funeral.burial_type === 'burial' ? '매장' : '화장'}</span>
                        </div>
                      )}
                      {funeral.family_members && funeral.family_members.length > 0 && (
                        <div>
                          <span className="text-gray-500">상주:</span>
                          <span className="ml-2 font-medium">{funeral.family_members[0]?.name || '-'}</span>
                          {funeral.family_members[0]?.phone && (
                            <span className="ml-2 text-gray-400">({funeral.family_members[0].phone})</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {funeral.created_at && (
                      <div className="mt-3 text-xs text-gray-400">
                        저장일시: {new Date(funeral.created_at).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 액션 버튼 */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (funeral.room_id) {
                        setCurrentPage(funeral.room_id);
                      }
                    }}
                    className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700 whitespace-nowrap"
                  >
                    보기
                  </button>
                  <button
onClick={async () => {
  if (confirm('이 장례 정보를 삭제하시겠습니까?')) {
    try {
      if (funeral.id) {
        await deleteFuneral(funeral.id);
        await loadSavedFuneralsList();
        alert('삭제되었습니다.');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  }
}}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 whitespace-nowrap"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompletedFunerals = () => {
    // localStorage에서 모든 저장된 장례 정보 불러오기
    const allFunerals = savedFuneralsList.length > 0 ? savedFuneralsList : [];
    
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">지난상가</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => loadSavedFuneralsList()} 
              className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
            >
              새로고침
            </button>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              onClick={() => {
                alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
              }}
            >
              엑셀 다운로드
            </button>
          </div>
        </div>
        
        {allFunerals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            저장된 장례 정보가 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">고인명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">한자명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">나이</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">성별</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">종교</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">빈소</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">입실일시</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">발인일시</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">장지</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">상주</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">연락처</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {allFunerals.map((funeral, index) => {
                  const chiefMourner = funeral.family_members?.find((m: any) => m.relation === '상주');
                  const roomName = funeral.room_id ? funeral.room_id.replace('room-', '') + '빈소' : '-';
                  
                  return (
                    <tr key={funeral.id || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                      <td className="px-4 py-3 text-sm font-medium">{funeral.deceased_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{funeral.deceased_hanja || '-'}</td>
                      <td className="px-4 py-3 text-sm">{funeral.age ? `${funeral.age}세` : '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{funeral.gender || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {funeral.religion ? (
                          <span>
                            {getReligionSymbol(funeral.religion)} {funeral.religion}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{roomName}</td>
                      <td className="px-4 py-3 text-sm text-xs">
                        {funeral.placement_time ? new Date(funeral.placement_time).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-xs text-red-600 font-medium">
                        {funeral.funeral_time ? new Date(funeral.funeral_time).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{funeral.burial_location || '-'}</td>
                      <td className="px-4 py-3 text-sm">{chiefMourner?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{chiefMourner?.phone || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            if (funeral.room_id) {
                              setCurrentPage(funeral.room_id);
                              setActiveTab('현황판');
                            }
                          }}
                          className="bg-slate-600 text-white px-3 py-1 rounded text-xs hover:bg-slate-700"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="bg-gray-50 px-6 py-3 border-t">
              <p className="text-sm text-gray-600">
                총 <span className="font-bold text-blue-600">{allFunerals.length}</span>건의 장례 기록
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHygiene = () => (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">기간</span>
          <label className="flex items-center gap-1">
            <input type="radio" name="period" defaultChecked />
            <span className="text-sm">발인</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="period" />
            <span className="text-sm">입실</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">기간</span>
          <input type="date" defaultValue="2025-10-01" className="border rounded px-2 py-1 text-sm" />
          <span className="text-sm">부터</span>
          <input type="date" defaultValue="2025-10-04" className="border rounded px-2 py-1 text-sm" />
          <span className="text-sm">까지</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">발인</span>
          <select className="border rounded px-2 py-1 text-sm">
            <option>전체</option>
          </select>
        </div>
        <button className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">엑셀다운로드</button>
      </div>
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-2 py-2 border border-gray-300">NO</th>
              <th className="px-2 py-2 border border-gray-300">처리일자</th>
              <th className="px-2 py-2 border border-gray-300">빈소</th>
              <th className="px-2 py-2 border border-gray-300">성명</th>
              <th className="px-2 py-2 border border-gray-300">성별</th>
              <th className="px-2 py-2 border border-gray-300">주민등록번호</th>
              <th className="px-2 py-2 border border-gray-300">사망일자</th>
              <th className="px-2 py-2 border border-gray-300">사망원인</th>
              <th className="px-2 py-2 border border-gray-300">사망장소</th>
              <th className="px-2 py-2 border border-gray-300">안치일자</th>
              <th className="px-2 py-2 border border-gray-300">약품처리</th>
              <th className="px-2 py-2 border border-gray-300">염습</th>
              <th className="px-2 py-2 border border-gray-300">장례주관</th>
              <th className="px-2 py-2 border border-gray-300">매장/화장</th>
              <th className="px-2 py-2 border border-gray-300">장지</th>
              <th className="px-2 py-2 border border-gray-300">상주이름</th>
              <th className="px-2 py-2 border border-gray-300">상주연락처</th>
              <th className="px-2 py-2 border border-gray-300">상주주소</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-pink-100">
              <td className="px-2 py-2 border border-gray-300 text-center">1</td>
              <td className="px-2 py-2 border border-gray-300">2025-10-01</td>
              <td className="px-2 py-2 border border-gray-300">2빈소 (2층)</td>
              <td className="px-2 py-2 border border-gray-300">김상대</td>
              <td className="px-2 py-2 border border-gray-300 text-center">남</td>
              <td className="px-2 py-2 border border-gray-300">650101-1234567</td>
              <td className="px-2 py-2 border border-gray-300">2025-09-29</td>
              <td className="px-2 py-2 border border-gray-300">질병</td>
              <td className="px-2 py-2 border border-gray-300">자택</td>
              <td className="px-2 py-2 border border-gray-300">2025-09-30</td>
              <td className="px-2 py-2 border border-gray-300 text-center">O</td>
              <td className="px-2 py-2 border border-gray-300 text-center">O</td>
              <td className="px-2 py-2 border border-gray-300">삼성장례식장</td>
              <td className="px-2 py-2 border border-gray-300">화장</td>
              <td className="px-2 py-2 border border-gray-300">수원화장장</td>
              <td className="px-2 py-2 border border-gray-300">김철수</td>
              <td className="px-2 py-2 border border-gray-300">010-1234-5678</td>
              <td className="px-2 py-2 border border-gray-300">서울시 강남구</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetailModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">고인정보상세입력</h3>
          <button onClick={() => setShowDetailModal(false)} className="text-white"><X size={24} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold">■ 고인</h4>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-sm block mb-1">고인이름</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label className="text-sm block mb-1">주민번호</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" /></div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold">■ 상주정보</h4>
              <div><label className="text-sm block mb-1">상주이름</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" /></div>
            </div>
          </div>
          <button onClick={() => setShowDetailModal(false)} className="w-full bg-slate-600 text-white py-3 rounded-lg mt-6">저장</button>
        </div>
      </div>
    </div>
  );

  const renderRoomDetail = (roomId: number) => {
    const room = rooms[roomId - 1];
    return (
      <div className="bg-gray-50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold">{room.name} {room.floor && `(${room.floor})`}</h2>
          <button onClick={() => setShowDetailModal(true)} className="bg-slate-600 text-white px-4 py-1 rounded text-sm hover:bg-slate-700">고인정보상세입력</button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              console.log('=== 부고장 미리보기 시작 ===');
              console.log('1. 고인이름:', deceasedName);
              console.log('2. 고인나이:', deceasedAge);
              console.log('3. 사진 여부:', deceasedPhoto ? '있음' : '없음');
              console.log('4. 종교:', religion);
              console.log('5. 발인시간:', funeralTime);
              
              if (!deceasedName) {
                alert('고인 이름을 먼저 입력해주세요.');
                return;
              }
              
              // 데이터를 SessionStorage에 저장 (URL에 큰 데이터 전달 방지)
              const obituaryData = {
                deceasedName: deceasedName,
                deceasedNameHanja: deceasedNameHanja,
                deceasedAge: deceasedAge,
                gender: deceasedGender,
                religion: religion,
                religionTitle: religionTitle,
                placementTime: placementTime,
                casketTime: casketTime,
                shroudTime: shroudTime,
                funeralTime: funeralTime,
                deathTime: deathTime,
                room: room.name + (room.floor ? ` (${room.floor})` : ''),
                familyMembers: familyMembers,
                chiefMessage: chiefMournerMessage,
                burialType: burialType,
                burialLocation: burialLocation,
                photo: usePhotoInObituary ? deceasedPhoto : null,
                bankAccounts: bankAccounts.filter(a => a.bankName || a.accountNumber || a.accountHolder)
              };
              
              console.log('6. 저장할 데이터:', obituaryData);
              
              // SessionStorage에 저장
              sessionStorage.setItem('obituaryPreview', JSON.stringify(obituaryData));
              
              // 저장 확인
              const saved = sessionStorage.getItem('obituaryPreview');
              console.log('7. 저장 확인:', saved ? 'SessionStorage에 저장됨' : '저장 실패!');
              
              if (saved) {
                console.log('8. 저장된 데이터 일부:', JSON.parse(saved).deceasedName);
              }
              
              alert(`부고장 미리보기를 엽니다.\n고인: ${deceasedName}`);
              
              // 데이터 없이 URL만 전달 - MODERN 스타일로 이동
              const url = `/obituary/modern`;
              
              try {
                const newWindow = window.open(url, '_blank');
                if (!newWindow) {
                  alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
                }
              } catch (error) {
                console.error('부고장 열기 실패:', error);
                alert('부고장을 열 수 없습니다.');
              }
            }} 
            className="bg-purple-700 text-white px-4 py-1 rounded text-sm hover:bg-purple-800"
            type="button"
          >
            부고장미리보기
          </button>
          {room.status === 'available' ? (
            <button onClick={() => handleCheckIn(roomId)} className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">입실</button>
          ) : (
            <button onClick={() => handleCheckOut(roomId)} className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-700">퇴실</button>
          )}
          <select 
            value={selectedMoveRoom} 
            onChange={(e) => setSelectedMoveRoom(e.target.value)}
            className="border rounded px-3 py-1 text-sm ml-auto"
          >
            <option value="">이동할 빈소를 선택해주세요</option>
            {rooms.filter(r => r.id !== roomId && r.id <= 5).map(r => (
              <option key={r.id} value={r.id}>
                {r.name} {r.floor && `(${r.floor})`} {r.status === 'occupied' ? '- 사용중' : ''}
              </option>
            ))}
          </select>
          <button 
            onClick={() => handleMoveRoom(roomId)}
            className="bg-slate-600 text-white px-4 py-1 rounded text-sm hover:bg-slate-700"
          >
            빈소이동
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="font-bold">■ 고인</div>
            <div className="flex gap-2 items-center">
              <label className="text-sm w-24">입실시간</label>
              <input 
                type="text" 
                value={placementTime} 
                onChange={(e) => {
                  setPlacementTime(e.target.value);
                  setPlacementDate(e.target.value);
                }} 
                className="flex-1 border rounded px-2 py-1 text-sm" 
              />
              <button onClick={setCurrentTime} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300 whitespace-nowrap">현재시간</button>
              <button onClick={() => calculateFuneralDate(3)} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">3일장</button>
              <button onClick={() => calculateFuneralDate(4)} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">4일장</button>
            </div>
            <div className="flex gap-2"><label className="text-sm w-24">고인이름 *</label><input type="text" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">한자명</label><input type="text" value={deceasedNameHanja} onChange={(e) => setDeceasedNameHanja(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">세례명 외</label><input type="text" value={baptismalName} onChange={(e) => setBaptismalName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">고인나이</label><input type="text" value={deceasedAge} onChange={(e) => setDeceasedAge(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 75" /></div>
            <div className="flex gap-2">
              <label className="text-sm w-24">고인성별</label>
              <select 
                value={deceasedGender} 
                onChange={(e) => setDeceasedGender(e.target.value)} 
                className="flex-1 border rounded px-2 py-1 text-sm"
              >
                <option value="">--선택--</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>
            <div className="flex gap-2">
              <label className="text-sm w-24">종교</label>
              <select 
                value={religion} 
                onChange={(e) => handleReligionChange(e.target.value)} 
                className="border rounded px-2 py-1 text-sm mr-2"
              >
                <option value="">종교선택</option>
                <option value="불교">불교</option>
                <option value="기독교">기독교</option>
                <option value="천주교">천주교</option>
                <option value="원불교">원불교</option>
                <option value="유교">유교</option>
                <option value="무교">무교</option>
              </select>
              <select 
                value={religionTitle} 
                onChange={(e) => setReligionTitle(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                disabled={!religion || religionTitles[religion]?.length === 0}
              >
                <option value="">{religion ? religionDeathTerms[religion] : '별세'}</option>
                {religion && religionTitles[religion]?.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2"><label className="text-sm w-24">기타대우</label><input type="text" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">염습시간</label><input type="text" value={shroudTime} onChange={(e) => setShroudTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="입관 2-3시간 전" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">입관시간</label><input type="text" value={casketTime} onChange={(e) => setCasketTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">발인시간</label><input type="text" value={funeralTime} onChange={(e) => {setFuneralTime(e.target.value); setCheckoutTime(e.target.value);}} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">퇴실시간</label><input type="text" value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} placeholder="발인시간과 다른 경우만 입력" className="flex-1 border rounded px-2 py-1 text-sm text-gray-500" /></div>
            <div className="flex gap-2">
              <label className="text-sm w-24">1차장지</label>
              <input 
                type="text" 
                value={burialLocation} 
                onChange={(e) => setBurialLocation(e.target.value)} 
                className="flex-1 border rounded px-2 py-1 text-sm" 
                placeholder="예: 원주시 문막 선영"
              />
            </div>
            <div className="flex gap-2">
              <label className="text-sm w-24">2차장지</label>
              <input 
                type="text" 
                value={burialLocation2} 
                onChange={(e) => setBurialLocation2(e.target.value)} 
                className="flex-1 border rounded px-2 py-1 text-sm" 
                placeholder="예: 영동 화장장"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">고인 사진</label>
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label 
                htmlFor="photo-upload" 
                className="inline-block bg-slate-700 text-white px-4 py-2 rounded text-sm mb-2 cursor-pointer hover:bg-slate-600"
              >
                사진 등록
              </label>
              {deceasedPhoto && (
                <button 
                  onClick={handlePhotoRemove}
                  className="ml-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  사진 삭제
                </button>
              )}
              <div className="w-32 h-40 border rounded bg-gray-100 overflow-hidden mt-2">
                {deceasedPhoto ? (
                  <img 
                    src={deceasedPhoto} 
                    alt="고인 사진" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    사진 없음
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t space-y-3">
              <div className="flex gap-2"><label className="text-sm w-24">주민번호</label><input type="text" value={residentNumber} onChange={(e) => setResidentNumber(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 500101-1234567" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">안치일시</label><input type="text" value={placementDate} onChange={(e) => setPlacementDate(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">사망일시</label><input type="text" value={deathTime} onChange={(e) => setDeathTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">사망원인</label><input type="text" value={deathCause} onChange={(e) => setDeathCause(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 노환, 질병" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">사망장소</label><input type="text" value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 자택, 병원" /></div>
              <div>
                <label className="text-sm block mb-1">매장/화장</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="burial" 
                      value="burial"
                      checked={burialType === 'burial'}
                      onChange={() => setBurialType('burial')}
                      className="w-4 h-4"
                    /> 
                    <span>매장</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="burial" 
                      value="cremation"
                      checked={burialType === 'cremation'}
                      onChange={() => setBurialType('cremation')}
                      className="w-4 h-4"
                    /> 
                    <span>화장</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm block mb-1">약품처리</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="chemical" 
                      value="yes"
                      checked={chemicalTreatment === 'yes'}
                      onChange={() => setChemicalTreatment('yes')}
                      className="w-4 h-4"
                    /> 
                    <span>화인</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="chemical" 
                      value="no"
                      checked={chemicalTreatment === 'no'}
                      onChange={() => setChemicalTreatment('no')}
                      className="w-4 h-4"
                    /> 
                    <span>미처리</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2"><label className="text-sm w-24">고인주소</label><input type="text" value={deceasedAddress} onChange={(e) => setDeceasedAddress(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">고인비고</label><textarea value={deceasedNote} onChange={(e) => setDeceasedNote(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" rows={3}></textarea></div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">■ 유가족</div>
                <div className="flex gap-2 text-sm">
                  <button onClick={addFamilyMember} className="text-blue-600 hover:text-blue-800">+ 추가</button>
                </div>
              </div>
              <div className="space-y-2">
                {getSortedFamilyMembers().map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <select 
                      value={member.relation} 
                      onChange={(e) => updateFamilyMember(member.id, 'relation', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-24"
                    >
                      <option value="">관계</option>
                      <option value="상주">상주</option>
                      <option value="배우자">배우자</option>
                      <option value="아들">아들</option>
                      <option value="딸">딸</option>
                      <option value="며느리">며느리</option>
                      <option value="사위">사위</option>
                      <option value="손">손</option>
                      <option value="손자">손자</option>
                      <option value="손녀">손녀</option>
                      <option value="형제">형제</option>
                      <option value="자매">자매</option>
                    </select>
                    <input 
                      type="text" 
                      value={member.name}
                      onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                      placeholder="이름" 
                      className="border rounded px-2 py-1 text-sm flex-1" 
                    />
                    <input 
                      type="text" 
                      value={member.phone}
                      onChange={(e) => updateFamilyMember(member.id, 'phone', e.target.value)}
                      placeholder="연락처" 
                      className="border rounded px-2 py-1 text-sm w-32" 
                    />
                    {familyMembers.length > 1 && (
                      <button 
                        onClick={() => removeFamilyMember(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-2"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">■ 부의금 계좌정보</div>
                <button 
                  onClick={addBankAccount} 
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + 계좌 추가
                </button>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg space-y-3">
                {bankAccounts.map((account, index) => (
                  <div key={account.id} className="space-y-2 pb-3 border-b border-blue-200 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        계좌 {index + 1}
                      </span>
                      {bankAccounts.length > 1 && (
                        <button 
                          onClick={() => removeBankAccount(account.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm w-24">은행명</label>
                      <input 
                        type="text" 
                        value={account.bankName} 
                        onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)} 
                        className="flex-1 border rounded px-2 py-1 text-sm" 
                        placeholder="예: 농협은행"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm w-24">계좌번호</label>
                      <input 
                        type="text" 
                        value={account.accountNumber} 
                        onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)} 
                        className="flex-1 border rounded px-2 py-1 text-sm" 
                        placeholder="예: 123-4567-8901-23"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm w-24">예금주</label>
                      <input 
                        type="text" 
                        value={account.accountHolder} 
                        onChange={(e) => updateBankAccount(account.id, 'accountHolder', e.target.value)} 
                        className="flex-1 border rounded px-2 py-1 text-sm" 
                        placeholder="예: 홍길동(상주)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="font-bold mb-2">■ 모바일부고장</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">사진사용</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  checked={usePhotoInObituary}
                  onChange={(e) => setUsePhotoInObituary(e.target.checked)}
                />
              </div>
              <div><label className="text-sm block mb-1">상주말씀</label><textarea value={chiefMournerMessage} onChange={(e) => setChiefMournerMessage(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={3} placeholder="모바일 부고장에 남길 상주 말씀을 입력하세요."></textarea></div>
            </div>
            <div className="border-t pt-4">
              <div className="font-bold mb-2">■ 업무현황</div>
              <div className="flex gap-4 text-sm items-center mb-3">
                <span className="font-semibold">정보</span>
                <label className="flex items-center gap-1">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>사인</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>진단</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>검사</span>
                </label>
              </div>
              <div className="space-y-3">
                <div><label className="text-sm block mb-1">업무비고</label><textarea value={businessNote} onChange={(e) => setBusinessNote(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2}></textarea></div>
                <div><label className="text-sm block mb-1">장례주관</label><input type="text" value={funeralCompany} onChange={(e) => setFuneralCompany(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label className="text-sm block mb-1">장례지도사</label><input type="text" value={funeralDirector} onChange={(e) => setFuneralDirector(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={handleSaveRoomInfo} className="flex-1 bg-slate-600 text-white py-2 rounded hover:bg-slate-700">저장</button>
              <button onClick={handleReset} className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600">초기화</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 현황판 렌더링 - 개선된 버전
  const renderDashboard = () => {
    // 가족 구성원을 관계별로 그룹화하는 함수
    const groupFamilyByRelation = (familyMembers: any[]) => {
      const grouped: { [key: string]: string[] } = {};
      familyMembers?.forEach((member: any) => {
        if (member.relation && member.name) {
          if (!grouped[member.relation]) {
            grouped[member.relation] = [];
          }
          grouped[member.relation].push(member.name);
        }
      });
      return grouped;
    };

    // 현재 날짜와 시간
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    });
    const timeStr = currentDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <div className="bg-gray-900 flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-800 text-white px-8 py-3 shadow-lg">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">영동병원장례식장</h1>
            <div className="text-lg">
              {dateStr} {timeStr}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-1">
          <div className="max-w-screen-2xl mx-auto">
            {/* Search Bar */}
            <div className="mb-1 bg-white p-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  placeholder="상주검색" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="border rounded px-3 py-2 text-sm w-64" 
                />
                <button className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800">
                  <Search size={16} className="inline mr-1" />
                  검색
                </button>
                <button 
                  onClick={() => loadAllRoomsData()} 
                  className="ml-auto bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
                >
                  새로고침
                </button>
                <button 
                  onClick={() => {
                    window.open('/status-board', '_blank', 'fullscreen=yes');
                  }}
                  className="bg-purple-700 text-white px-4 py-2 rounded text-sm hover:bg-purple-800"
                >
                  현황판보기
                </button>
              </div>
            </div>

            {/* 빈소 카드 - 3x2 그리드 (6개 빈소) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {rooms.map(room => {
                const roomKey = `room-${room.id}`;
                const funeralData = roomFunerals[roomKey];
                const isOccupied = !!funeralData;
                const familyGroups = funeralData ? groupFamilyByRelation(funeralData.family_members) : {};
                
                // 현재 시간
                const now = new Date();
                const dateStr = `${now.getMonth() + 1}월 ${now.getDate()}일 (${['일','월','화','수','목','금','토'][now.getDay()]}) 오전 ${now.getHours() > 12 ? now.getHours() - 12 : now.getHours()}시`;

                return (
                  <div 
                    key={room.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-2xl cursor-pointer"
                    onClick={() => room.floor && setCurrentPage(`room-${room.id}`)}
                    style={{ border: '3px solid #475569', minWidth: '520px' }}
                  >
                    {/* Top Header - 컴팩트 */}
                    <div className="bg-slate-700 text-white px-4 py-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm">의료법인 조은의료재단</div>
                        <div className="text-xl font-bold">영동병원장례식장</div>
                      </div>
                      <div className="text-base">{dateStr}</div>
                    </div>
                    
                    {/* Room and Deceased info bar - 컴팩트 */}
                    <div className="bg-slate-600 text-white px-4 py-3.5">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-900/30 px-5 py-2 rounded">
                          <span className="text-xl font-bold">{room.name} ({room.floor || ''})</span>
                        </div>
                        {isOccupied && funeralData && (
                          <div className="flex items-center gap-2">
                            {funeralData.religion && getReligionSymbol(funeralData.religion) && (
                              <span className="text-red-400 text-xl">{getReligionSymbol(funeralData.religion)}</span>
                            )}
                            <span className="text-xl font-bold">
                              故 {funeralData.deceased_name}
                              {funeralData.religion_title && ` (${funeralData.religion_title})`}
                              {funeralData.age && funeralData.gender && ` (${funeralData.gender}/${funeralData.age}세)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Main Content - 높이 축소 */}
                    <div className="bg-gray-100">
                      {isOccupied && funeralData ? (
                        <div className="flex">
                          {/* Photo section - 축소 */}
                          <div className="w-48 p-5 bg-white">
                            {funeralData.photo_url ? (
                              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                                <img 
                                  src={funeralData.photo_url} 
                                  alt="영정사진" 
                                  className="w-full h-full object-cover"
                                />
                            </div>
                            ) : (
                              <div className="w-full h-48 bg-gray-300 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 text-base">영정사진</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Family info - 컴팩트 */}
                          <div className="flex-1 p-5 bg-white">
                            {Object.keys(familyGroups).length > 0 && (
                              <div className="space-y-3">
                                {Object.entries(familyGroups).map(([relation, names]) => (
                                  <div key={relation} className="flex items-start text-base">
                                    <span className="font-bold min-w-[80px]">{relation}</span>
                                    <span className="text-xl font-bold mx-2">:</span>
                                    <span className="text-gray-800">{names.join(', ')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-28 bg-white">
                          <div className="text-center">
                            <div className="text-gray-300 text-5xl mb-3">🕊️</div>
                            <p className="text-gray-400 text-xl font-medium">공실</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule section - 컴팩트 */}
                    {isOccupied && funeralData && (
                      <div className="flex border-t-2 border-slate-700">
                        <div className="flex-1 bg-white border-r border-gray-300">
                          <div className="bg-slate-700 text-white text-center py-3">
                            <span className="text-base font-bold">입 관</span>
                          </div>
                          <div className="text-center py-3 text-sm">
                            {funeralData.casket_time ? formatScheduleDate(funeralData.casket_time) : '시간미정'}
                          </div>
                        </div>
                        <div className="flex-1 bg-white border-r border-gray-300">
                          <div className="bg-slate-700 text-white text-center py-3">
                            <span className="text-base font-bold">발 인</span>
                          </div>
                          <div className="text-center py-3 text-sm">
                            {funeralData.funeral_time ? formatScheduleDate(funeralData.funeral_time) : '시간미정'}
                          </div>
                        </div>
                        <div className="flex-1 bg-white">
                          <div className="bg-slate-700 text-white text-center py-3">
                            <span className="text-base font-bold">장 지</span>
                          </div>
                          <div className="text-center py-3 text-sm px-2">
                            {funeralData.burial_location || '미정'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Bottom Footer - 컴팩트 */}
                    <div className="bg-gray-200 text-gray-700 text-sm">
                      <div className="px-4 py-2">
                        영동병원장례식장: 충청북도 영동군 영동읍 대학로 106 (설계리, 영동병원), 043-743-4499
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-slate-800 text-white px-8 py-3">
          <div className="max-w-screen-2xl mx-auto text-center">
            <p className="text-sm">
              영동병원장례식장 | 충청북도 영동군 영동읍 대학로 106 (설계리, 영동병원) | ☎ 043-743-4493
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="w-64 bg-gray-800 text-white p-4 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">영동병원</h2>
          <p className="text-sm text-gray-400">장례식장 관리시스템</p>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setCurrentPage('dashboard')} className={`w-full text-left px-4 py-2 rounded ${currentPage === 'dashboard' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}>현황판</button>
          {roomMenuItems.map(room => {
            const roomKey = room.id;
            const hasData = !!roomFunerals[roomKey];
            return (
              <button 
                key={room.id} 
                onClick={() => setCurrentPage(room.id)} 
                className={`w-full flex items-center justify-between px-4 py-2 rounded ${currentPage === room.id ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
              >
                <span className="text-sm">{room.label}</span>
                <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-red-400' : 'bg-green-400'}`}></span>
              </button>
            );
          })}
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm">예비</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm">종합안내_1층</button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm">종합안내_2층</button>
          <div className="border-t border-gray-700 my-4"></div>
          <button 
            onClick={() => setCurrentPage('saved')} 
            className={`w-full text-left px-4 py-2 rounded ${currentPage === 'saved' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
          >
            저장된 장례정보
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span>설정</span>
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded">환경설정</button>
          <button onClick={() => setCurrentPage('hygiene')} className={`w-full text-left px-4 py-2 rounded ${currentPage === 'hygiene' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}>위생처리관리대장</button>
        </nav>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTabHeader()}
        <div className="flex-1 overflow-y-auto">
          {currentPage === 'hygiene' ? renderHygiene() :
           currentPage === 'saved' ? renderSavedFunerals() :
           activeTab === '지난상가' ? renderCompletedFunerals() : 
           currentPage.startsWith('room-') ? renderRoomDetail(parseInt(currentPage.split('-')[1])) : renderDashboard()}
        </div>
      </div>
      {showDetailModal && renderDetailModal()}
    </div>
  );
}