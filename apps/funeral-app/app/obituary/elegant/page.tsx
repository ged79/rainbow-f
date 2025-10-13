'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Share2, Heart, Flower } from 'lucide-react';

export default function ElegantObituary() {
  const [showCondolence, setShowCondolence] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [obituaryData, setObituaryData] = useState<any>(null);

  useEffect(() => {
    console.log('=== 세련된 부고장 데이터 불러오기 ===');
    try {
      const savedData = sessionStorage.getItem('obituaryPreview');
      if (savedData) {
        const data = JSON.parse(savedData);
        setObituaryData(data);
        console.log('데이터 로드 완료:', data.deceasedName);
      }
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
    }
  }, []);

  // 데이터 추출
  const deceasedName = obituaryData?.deceasedName || '故人';
  const deceasedNameHanja = obituaryData?.deceasedNameHanja || '';
  const deceasedAge = obituaryData?.deceasedAge || '75';
  const religion = obituaryData?.religion || '';
  const religionTitle = obituaryData?.religionTitle || '';
  const placementTime = obituaryData?.placementTime || '2025년 10월 4일 10:00';
  const casketTime = obituaryData?.casketTime || '2025년 10월 6일 14:00';
  const funeralTime = obituaryData?.funeralTime || '2025년 10월 7일 07:00';
  const deathTime = obituaryData?.deathTime || '2025년 10월 3일';
  const room = obituaryData?.room || '1빈소';
  const chiefMessage = obituaryData?.chiefMessage || '삼가 고인의 명복을 빕니다.';
  const burialType = obituaryData?.burialType || 'cremation';
  const photo = obituaryData?.photo || '';
  const shroudTime = obituaryData?.shroudTime || '2025년 10월 6일 11:00';
  
  let familyMembers = [
    { relation: '상주', name: '홍철수', phone: '010-1234-5678' }
  ];
  
  if (obituaryData?.familyMembers && obituaryData.familyMembers.length > 0) {
    familyMembers = obituaryData.familyMembers.filter((m: any) => m.name && m.relation);
  }

  const age = deceasedAge ? `향년 ${deceasedAge}세` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50">
      {/* 상단 장식 */}
      <div className="h-2 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-800"></div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="inline-block">
            <div className="border-b-4 border-amber-800 pb-3 mb-2">
              <h1 className="text-4xl font-serif text-amber-900 tracking-wider">訃 告</h1>
            </div>
            <p className="text-sm text-amber-700 tracking-widest">OBITUARY</p>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-amber-100">
          
          {/* 고인 정보 섹션 */}
          <div className="bg-gradient-to-b from-amber-50 to-white px-12 py-16 border-b-2 border-amber-200">
            <div className="flex flex-col md:flex-row items-center gap-12">
              
              {/* 영정사진 */}
              <div className="shrink-0">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-amber-200 to-stone-200 rounded-2xl opacity-50"></div>
                  <div className="relative w-56 h-72 bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-white">
                    {photo ? (
                      <img src={photo} alt="영정" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-stone-100">
                        <span className="text-amber-400 text-sm">영정사진</span>
                      </div>
                    )}
                  </div>
                  {/* 리본 장식 */}
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-amber-900 text-white px-6 py-1 rounded-full text-xs shadow-lg">
                    故人
                  </div>
                </div>
              </div>

              {/* 고인 정보 */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h2 className="text-5xl font-serif text-amber-900 mb-3">{deceasedName}</h2>
                  {deceasedNameHanja && (
                    <p className="text-2xl text-amber-700 font-serif mb-2">{deceasedNameHanja}</p>
                  )}
                  {age && (
                    <p className="text-xl text-amber-800 mt-3">{age}</p>
                  )}
                </div>
                
                {(religion || religionTitle) && (
                  <div className="pt-4 border-t border-amber-200">
                    <p className="text-lg text-amber-700">
                      {religion} {religionTitle}
                    </p>
                  </div>
                )}

                <div className="pt-4 space-y-2 text-amber-800">
                  <p className="flex items-center justify-center md:justify-start gap-2">
                    <span className="text-amber-600">✦</span>
                    <span className="font-medium">별세</span>
                    <span className="text-amber-700">{deathTime}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="px-12 py-10 bg-white">
            <h3 className="text-2xl font-serif text-amber-900 mb-8 text-center border-b-2 border-amber-200 pb-3">
              장례 일정
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {[
                { label: '입실', value: placementTime, icon: '🕊' },
                { label: '염습', value: shroudTime, icon: '🕯' },
                { label: '입관', value: casketTime, icon: '⚱' },
                { label: '발인', value: funeralTime, icon: '🌸', highlight: true }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    item.highlight 
                      ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400 shadow-lg' 
                      : 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`font-semibold ${item.highlight ? 'text-amber-900 text-lg' : 'text-amber-800'}`}>
                      {item.label}
                    </span>
                  </div>
                  <p className={`${item.highlight ? 'text-amber-900 font-medium' : 'text-amber-700'} ml-11`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <div className="inline-block bg-gradient-to-r from-amber-100 to-stone-100 px-8 py-4 rounded-2xl border-2 border-amber-300">
                <p className="text-amber-700 mb-1 text-sm">빈소</p>
                <p className="text-amber-900 font-semibold text-lg">{room}</p>
                <p className="text-amber-600 text-sm mt-2">영등병원 장례식장</p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-block bg-amber-50 px-6 py-3 rounded-xl border border-amber-200">
                <p className="text-amber-700 text-sm mb-1">장지</p>
                <p className="text-amber-900">{burialType === 'burial' ? '매장' : '화장'} · 서울추모공원</p>
              </div>
            </div>
          </div>

          {/* 유가족 */}
          <div className="px-12 py-10 bg-gradient-to-b from-white to-amber-50">
            <h3 className="text-2xl font-serif text-amber-900 mb-8 text-center border-b-2 border-amber-200 pb-3">
              상 주
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {familyMembers.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-xl border border-amber-200 hover:border-amber-300 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-sm font-medium">
                      {member.relation}
                    </span>
                    <span className="text-amber-900 font-medium text-lg">{member.name}</span>
                  </div>
                  <a href={`tel:${member.phone}`} className="text-amber-700 hover:text-amber-900 transition-colors">
                    <Phone size={18} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* 상주 말씀 */}
          {chiefMessage && (
            <div className="px-12 py-10 bg-gradient-to-br from-amber-50 via-white to-stone-50">
              <h3 className="text-2xl font-serif text-amber-900 mb-8 text-center border-b-2 border-amber-200 pb-3">
                상주 말씀
              </h3>
              <div className="max-w-2xl mx-auto">
                <div className="bg-white/80 p-8 rounded-2xl border-2 border-amber-200 shadow-inner">
                  <p className="text-amber-800 leading-relaxed whitespace-pre-wrap text-center">
                    {chiefMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 장례식장 정보 */}
          <div className="px-12 py-10 bg-white border-t-2 border-amber-200">
            <h3 className="text-2xl font-serif text-amber-900 mb-8 text-center">
              장례식장 안내
            </h3>
            
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                <p className="text-amber-900 font-semibold text-xl mb-4">영등병원 장례식장</p>
                <div className="space-y-3 text-amber-800">
                  <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-amber-600 mt-1 shrink-0" />
                    <span>서울시 양천구 신정로 123</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={20} className="text-amber-600 shrink-0" />
                    <a href="tel:02-1234-5678" className="hover:text-amber-900 transition-colors">
                      02-1234-5678
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-24"></div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t-2 border-amber-200 shadow-2xl z-50">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-amber-200">
          <button 
            onClick={() => setShowDonation(true)}
            className="flex flex-col items-center gap-2 py-5 hover:bg-amber-50 transition-colors group"
          >
            <Heart size={24} className="text-amber-600 group-hover:text-amber-800 transition-colors" />
            <span className="text-sm font-medium text-amber-800">부의금</span>
          </button>
          <button 
            onClick={() => setShowFlower(true)}
            className="flex flex-col items-center gap-2 py-5 hover:bg-amber-50 transition-colors group"
          >
            <Flower size={24} className="text-amber-600 group-hover:text-amber-800 transition-colors" />
            <span className="text-sm font-medium text-amber-800">근조화환</span>
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: '부고', url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다.');
              }
            }}
            className="flex flex-col items-center gap-2 py-5 hover:bg-amber-50 transition-colors group"
          >
            <Share2 size={24} className="text-amber-600 group-hover:text-amber-800 transition-colors" />
            <span className="text-sm font-medium text-amber-800">공유하기</span>
          </button>
        </div>
      </div>

      {/* 부의금 모달 */}
      {showDonation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border-2 border-amber-200">
            <h3 className="font-serif text-2xl mb-6 text-amber-900 text-center">부의금 전달</h3>
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                <p className="text-sm text-amber-700 mb-2">계좌번호</p>
                <p className="font-bold text-amber-900 text-lg">국민은행 123-456-789012</p>
                <p className="text-sm text-amber-700 mt-3">예금주: {familyMembers[0]?.name || '상주'}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDonation(false)} 
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-2xl mt-6 hover:from-amber-700 hover:to-amber-800 font-medium transition-all shadow-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 근조화환 모달 */}
      {showFlower && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border-2 border-amber-200">
            <h3 className="font-serif text-2xl mb-6 text-amber-900 text-center">근조화환 보내기</h3>
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                <p className="text-sm text-amber-700 mb-2">연락처</p>
                <p className="font-bold text-amber-900 text-lg">02-1234-5678</p>
                <p className="text-sm text-amber-700 mt-3">주소</p>
                <p className="text-amber-900">서울시 양천구 신정로 123</p>
              </div>
            </div>
            <button 
              onClick={() => setShowFlower(false)} 
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-2xl mt-6 hover:from-amber-700 hover:to-amber-800 font-medium transition-all shadow-lg"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
