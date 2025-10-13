'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Share2, Heart, Flower, Calendar, Clock, Copy } from 'lucide-react';

export default function ModernObituary() {
  const [showCondolence, setShowCondolence] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [obituaryData, setObituaryData] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    // SessionStorage에서 데이터 불러오기
    console.log('=== 모던 부고장 데이터 불러오기 ===');
    try {
      const savedData = sessionStorage.getItem('obituaryPreview');
      console.log('1. SessionStorage에서 데이터 가져오기:', savedData ? '데이터 있음' : '데이터 없음');
      
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log('2. 파싱된 데이터:', data);
        console.log('3. 고인 이름:', data.deceasedName);
        console.log('4. 고인 나이:', data.deceasedAge);
        console.log('5. 사진 여부:', data.photo ? '있음' : '없음');
        setObituaryData(data);
        console.log('6. State에 데이터 저장 완료');
      } else {
        console.warn('⚠️ SessionStorage에 데이터가 없습니다!');
      }
    } catch (error) {
      console.error('❌ 데이터 불러오기 실패:', error);
    }
  }, []);

  // SessionStorage에서 불러온 데이터 또는 기본값 사용
  const deceasedName = obituaryData?.deceasedName || '홍길동';
  const deceasedNameHanja = obituaryData?.deceasedNameHanja || '洪吉童';  // 한자
  const deceasedAge = obituaryData?.deceasedAge || '75';
  const religion = obituaryData?.religion || '';
  const religionTitle = obituaryData?.religionTitle || '';
  
  // 종교별 호칭 처리
  let displayReligionInfo = '';
  if (religion && religion !== '무교') {
    displayReligionInfo = religion;
    if (religionTitle) {
      displayReligionInfo += ` ${religionTitle}`;
    }
  }
  const placementTime = obituaryData?.placementTime || '2025년 10월 4일 (금) 10:00';
  const casketTime = obituaryData?.casketTime || '2025년 10월 6일 (일) 14:00';
  const funeralTime = obituaryData?.funeralTime || '2025년 10월 7일 (월) 07:00';
  const deathTime = obituaryData?.deathTime || '2025년 10월 3일';
  const room = obituaryData?.room || '1빈소 (2층)';
  const chiefMessage = obituaryData?.chiefMessage || '평소 아버지께서 보여주신 사랑과 은혜에 감사드리며\n삼가 고인의 명복을 빕니다.\n\n마지막 가시는 길 함께해 주시기 바랍니다.';
  const burialType = obituaryData?.burialType || 'cremation';
  const photo = obituaryData?.photo || '';
  const shroudTime = obituaryData?.shroudTime || '2025년 10월 6일 (일) 11:00';
  
  // 데이터 확인 로그
  console.log('=== 부고장에 표시될 데이터 ===');
  console.log('고인이름:', deceasedName);
  console.log('나이:', deceasedAge);
  console.log('종교:', religion);
  console.log('발인:', funeralTime);
  console.log('빈소:', room);
  
  // 장례식장 정보
  const funeralHomeName = '영동병원 장례식장';
  const funeralHomeAddress = '충청북도 영동군 영동읍 대학로 106';
  const funeralHomePhone = '043-743-4493';
  const burialPlace = obituaryData?.burialLocation || '서울추모공원';
  
  // 유가족 데이터
  let familyMembers = [
    { relation: '상주', name: '홍철수', phone: '010-1234-5678' },
    { relation: '장남', name: '홍민수', phone: '010-2345-6789' },
    { relation: '차남', name: '홍진수', phone: '010-3456-7890' }
  ];
  
  if (obituaryData?.familyMembers && obituaryData.familyMembers.length > 0) {
    familyMembers = obituaryData.familyMembers.filter((m: any) => m.name && m.relation);
  }

  // 부의금 계좌 정보 (여러 계좌 지원)
  const bankAccounts = obituaryData?.bankAccounts || [
    { bankName: '국민은행', accountNumber: '123-456-789012', accountHolder: familyMembers[0]?.name || '상주' }
  ];
// 나이 형식 지정
const age = deceasedAge ? `향년 ${deceasedAge}세` : '향년 75세';

  // 조문글 목록 (기본값)
  const condolences = [
    { name: '김영희', message: '삼가 고인의 명복을 빕니다.', time: '2시간 전' },
    { name: '이철수', message: '좋은 곳으로 가셨기를 기원합니다.', time: '5시간 전' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 - 고정 & 축소 */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b-2 border-gray-200 py-4 z-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-xs text-gray-600">의료법인 조윤의료재단</div>
          <div className="text-xl font-bold text-gray-800">영동병원장례식장</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pb-24 px-4 mt-20">
        {/* 메인 카드 - 영정 및 고인정보 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 md:p-12">
            {/* 영정사진 */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-64 h-80 bg-gray-100 rounded-2xl shadow-xl overflow-hidden flex items-center justify-center border-2 border-gray-200">
                  {photo ? (
                    <img src={photo} alt="영정사진" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">영정사진</span>
                  )}
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-8 py-2 rounded-full shadow-lg">
                  <span className="text-sm font-medium">故人</span>
                </div>
              </div>
            </div>

            {/* 고인 정보 - 카드형 */}
            <div className="text-center space-y-4 mt-12">
              <h2 className="text-5xl font-bold text-gray-800">
                {deceasedName}
              </h2>
              <p className="text-gray-500 text-lg mt-2">삼가 故人의 冥福을 빕니다</p>
              <div className="flex items-center justify-center gap-3 mt-4">
                {displayReligionInfo && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-300">
                    {displayReligionInfo}
                  </span>
                )}
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-300">
                  {age}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 상주 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">상주 안내</h3>
          <div className="space-y-3">
            {familyMembers.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-16 text-gray-700 font-medium">{member.relation}</span>
                  <span className="font-semibold text-gray-800">{member.name}</span>
                </div>
                <a 
                  href={`tel:${member.phone}`} 
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  {member.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* 상세 일정 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Clock size={24} className="text-gray-600" />
            상세 일정
          </h3>
          <div className="space-y-4">
            {[
              { label: '별세', value: deathTime },
              { label: '입실', value: placementTime },
              { label: '염습', value: shroudTime },
              { label: '입관', value: casketTime },
              { label: '발인', value: funeralTime, highlight: true },
              { label: '장지', value: burialType === 'burial' ? `매장 - ${burialPlace}` : `화장 - ${burialPlace}` }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  item.highlight 
                    ? 'bg-gray-200 border-2 border-gray-400' 
                    : 'bg-gray-100'
                }`}
              >
                <span className={`font-medium ${item.highlight ? 'text-gray-800' : 'text-gray-600'}`}>
                  {item.label}
                </span>
                <span className={`font-semibold ${item.highlight ? 'text-gray-900' : 'text-gray-800'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 장례식장 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">장례식장 안내</h3>
          <div className="space-y-4">
            <div className="space-y-4">
            <p className="text-2xl font-bold text-gray-800">{funeralHomeName}</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="font-semibold text-gray-700">빈소: </span>
              <span className="text-gray-800">{room}</span>
            </div>
            <div className="flex items-start gap-3 text-gray-600">
              <MapPin size={20} className="text-gray-600 mt-1 shrink-0" />
              <span>{funeralHomeAddress}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-gray-600 shrink-0" />
              <a href={`tel:${funeralHomePhone}`} className="text-gray-800 hover:underline font-medium">
                {funeralHomePhone}
              </a>
            </div>
            </div>
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center mt-4 border-2 border-gray-300">
              <button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-full font-medium shadow-lg transition-all">
                지도에서 위치 보기
              </button>
            </div>
          </div>
        </div>

        {/* 상주 말씀 */}
        <div className="bg-gray-100 rounded-2xl shadow-lg p-8 mt-6 border-2 border-gray-300">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">상주 말씀</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-center text-lg">
            {chiefMessage}
          </p>
        </div>

        {/* 추모글 (전하는 말) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">추모글</h3>
            <button 
              onClick={() => setShowCondolence(true)}
              className="bg-gray-800 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-900 transition-all shadow-md"
            >
              + 글 남기기
            </button>
          </div>
          <div className="space-y-4">
            {condolences.map((item, idx) => (
              <div key={idx} className="bg-gray-100 border border-gray-300 p-5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-gray-300 shadow-2xl z-50">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x-2 divide-gray-300">
          <button 
            onClick={() => setShowDonation(true)}
            className="flex flex-col items-center gap-2 py-5 hover:bg-gray-100 transition-colors group"
          >
            <Heart size={24} className="text-gray-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">부의금</span>
          </button>
          <button 
          onClick={() => {
                // sessionStorage에 부고 데이터 저장
                sessionStorage.setItem('obituaryData', JSON.stringify({
                  ...obituaryData,
                  deceased: { name: deceasedName, hanja: deceasedNameHanja },
                  family: familyMembers,
                  schedule: { room, floor: '' }
                }));
                // 화환 주문 페이지로 이동
                window.location.href = '/obituary/flower';
              }}
            className="flex flex-col items-center gap-2 py-5 hover:bg-gray-100 transition-colors group"
          >
            <Flower size={24} className="text-gray-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">근조화환</span>
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: '부고', url: window.location.href });
              } else {
                alert('링크가 복사되었습니다.');
              }
            }}
            className="flex flex-col items-center gap-2 py-5 hover:bg-gray-100 transition-colors group"
          >
            <Share2 size={24} className="text-gray-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-700">공유하기</span>
          </button>
        </div>
      </div>

      {/* 조문글 모달 */}
      {showCondolence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h3 className="font-bold text-2xl mb-6 text-gray-800">조문글 남기기</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="성함" 
                className="w-full bg-gray-100 border border-gray-300 text-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-500" 
              />
              <textarea 
                placeholder="조문글을 입력해주세요" 
                className="w-full bg-gray-100 border border-gray-300 text-gray-800 rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCondolence(false)} 
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 font-medium transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => { alert('등록되었습니다.'); setShowCondolence(false); }} 
                className="flex-1 bg-gray-800 text-white py-3 rounded-xl hover:bg-gray-900 font-medium transition-all shadow-lg"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부의금 모달 */}
      {showDonation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-2xl mb-6 text-gray-800">부의금 전달</h3>
            <div className="space-y-4">
              {bankAccounts.map((account: any, index: number) => {
                const handleCopy = async () => {
                  try {
                    await navigator.clipboard.writeText(account.accountNumber);
                    setCopiedIndex(index);
                    setTimeout(() => setCopiedIndex(null), 2000);
                  } catch (err) {
                    console.error('복사 실패:', err);
                  }
                };
                
                return (
                  <div key={index} className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
                    {bankAccounts.length > 1 && (
                      <p className="text-xs text-gray-500 mb-2">계좌 {index + 1}</p>
                    )}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">계좌번호</p>
                        <p className="font-bold text-gray-800">{account.bankName} {account.accountNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">예금주: {account.accountHolder}</p>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="ml-4 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                      >
                        <Copy size={16} />
                        {copiedIndex === index ? '복사됨!' : '복사'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => setShowDonation(false)} 
              className="w-full bg-gray-800 text-white py-3 rounded-xl mt-6 hover:bg-gray-900 font-medium transition-all shadow-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}


    </div>
  );
}
