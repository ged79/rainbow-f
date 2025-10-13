'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Share2, Heart, Flower } from 'lucide-react';

export default function MinimalObituary() {
  const [showCondolence, setShowCondolence] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [obituaryData, setObituaryData] = useState<any>(null);

  useEffect(() => {
    // SessionStorage에서 데이터 불러오기
    console.log('=== 미니멀 부고장 데이터 불러오기 ===');
    try {
      const savedData = sessionStorage.getItem('obituaryPreview');
      console.log('1. SessionStorage 데이터:', savedData ? '있음' : '없음');
      
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log('2. 파싱된 데이터:', data);
        console.log('3. 고인 이름:', data.deceasedName);
        setObituaryData(data);
        console.log('4. State에 데이터 저장 완료');
      } else {
        console.warn('⚠️ SessionStorage에 데이터가 없습니다!');
      }
    } catch (error) {
      console.error('❌ 데이터 불러오기 실패:', error);
    }
  }, []);

  // SessionStorage에서 불러온 데이터 또는 기본값 사용
  const deceasedName = obituaryData?.deceasedName || '홍길동';
  const deceasedNameHanja = obituaryData?.deceasedNameHanja || '洪吉童';
  const deceasedAge = obituaryData?.deceasedAge || '75';
  const religion = obituaryData?.religion || '천주교';
  const religionTitle = obituaryData?.religionTitle || '세례명 요한';
  const placementTime = obituaryData?.placementTime || '2025년 10월 4일 (금) 10:00';
  const casketTime = obituaryData?.casketTime || '2025년 10월 6일 (일) 14:00';
  const funeralTime = obituaryData?.funeralTime || '2025년 10월 7일 (월) 07:00';
  const deathTime = obituaryData?.deathTime || '2025년 10월 3일';
  const room = obituaryData?.room || '1빈소 (2층)';
  const chiefMessage = obituaryData?.chiefMessage || '평소 아버지께서 보여주신 사랑과 은혜에 감사드리며\n삼가 고인의 명복을 빕니다.\n\n마지막 가시는 길 함께8해 주시기 바랍니다.';
  const burialType = obituaryData?.burialType || 'cremation';
  const photo = obituaryData?.photo || '';
  const shroudTime = obituaryData?.shroudTime || '2025년 10월 6일 (일) 11:00';
  
  // 유가족 데이터
  let familyMembers = [
    { relation: '상주', name: '홍철수', phone: '010-1234-5678' },
    { relation: '장남', name: '홍민수', phone: '010-2345-6789' },
    { relation: '차남', name: '홍진수', phone: '010-3456-7890' }
  ];
  
  if (obituaryData?.familyMembers && obituaryData.familyMembers.length > 0) {
    familyMembers = obituaryData.familyMembers.filter((m: any) => m.name && m.relation);
  }

  // 나이 형식
  const age = deceasedAge ? `향년 ${deceasedAge}세` : '향년 75세';
  const burialPlace = '서울추모공원';
  
  // 조문글 목록 (기본값)
  const condolences = [
    { name: '김영희', message: '삼가 고인의 명복을 빕니다.', time: '2시간 전' },
    { name: '이철수', message: '좋은 곳으로 가셨기를 기원합니다.', time: '5시간 전' }
  ];

  console.log('=== 미니멀 부고장에 표시될 데이터 ===');
  console.log('고인이름:', deceasedName);
  console.log('나이:', age);
  console.log('발인:', funeralTime);

  return (
    <div className="min-h-screen bg-white relative">
      {/* 헤더 - 극도로 심플 */}
      <div className="border-b relative z-10">
        <div className="max-w-xl mx-auto px-6 py-8 text-center">
          <div className="text-xs tracking-[0.3em] text-gray-400 mb-2">OBITUARY</div>
          <h1 className="text-sm text-gray-900">부고</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto pb-24 px-6 relative z-10">
        {/* 영정 및 고인정보 */}
        <div className="py-12 border-b">
          {/* 영정사진 */}
          <div className="flex justify-center mb-10">
            <div className="w-40 h-52 bg-gray-100 border border-gray-200 overflow-hidden">
              {photo ? (
                <img src={photo} alt="영정사진" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  사진 없음
                </div>
              )}
            </div>
          </div>

          {/* 고인 정보 */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-light text-gray-900 mb-3">{deceasedName}</h2>
            <p className="text-gray-500 text-sm">{deceasedNameHanja}</p>
            <p className="text-gray-600 text-sm mt-3">{religion} {religionTitle}</p>
            <p className="text-gray-900 text-base mt-2">{age}</p>
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="py-10 border-b">
          <h3 className="text-xs tracking-[0.2em] text-gray-400 mb-6">SCHEDULE</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">별세</span>
              <span className="text-gray-900">{deathTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">입실</span>
              <span className="text-gray-900">{placementTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">염습</span>
              <span className="text-gray-900">{shroudTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">입관</span>
              <span className="text-gray-900">{casketTime}</span>
            </div>
            <div className="flex justify-between text-sm pt-3 border-t">
              <span className="text-gray-900 font-medium">발인</span>
              <div className="text-right">
                <div className="text-gray-900 font-medium">{funeralTime}</div>
                <div className="text-gray-600 text-xs mt-1">{room}</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">장지</span>
              <div className="text-right">
                <div className="text-gray-900">{burialType === 'burial' ? '매장' : '화장'}</div>
                <div className="text-gray-600 text-xs mt-0.5">{burialPlace}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 장례식장 */}
        <div className="py-10 border-b">
          <h3 className="text-xs tracking-[0.2em] text-gray-400 mb-6">LOCATION</h3>
          <div className="space-y-5">
            <p className="text-gray-900 text-lg font-light">영등병원 장례식장</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">서울시 양천구 신정로 123</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <a href="tel:02-1234-5678" className="text-gray-700">
                  02-1234-5678
                </a>
              </div>
            </div>
            <div className="h-40 bg-gray-50 border border-gray-200 flex items-center justify-center mt-5">
              <button className="text-sm text-gray-600 border border-gray-300 px-6 py-2 hover:bg-gray-50">
                지도 보기
              </button>
            </div>
          </div>
        </div>

        {/* 유가족 */}
        <div className="py-10 border-b">
          <h3 className="text-xs tracking-[0.2em] text-gray-400 mb-6">FAMILY</h3>
          <div className="space-y-3">
            {familyMembers.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-2">
                <div className="flex items-center gap-6">
                  <span className="text-gray-500 w-12">{member.relation}</span>
                  <span className="text-gray-900">{member.name}</span>
                </div>
                <a href={`tel:${member.phone}`} className="text-gray-600">
                  {member.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* 상주 말씀 */}
        <div className="py-10 border-b bg-gray-50 -mx-6 px-6">
          <h3 className="text-xs tracking-[0.2em] text-gray-400 mb-6">MESSAGE</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
            {chiefMessage}
          </p>
        </div>

        {/* 전하는 말 */}
        <div className="py-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs tracking-[0.2em] text-gray-400">CONDOLENCE</h3>
            <button 
              onClick={() => setShowCondolence(true)}
              className="text-xs text-gray-600 border-b border-gray-300 hover:border-gray-600"
            >
              글 남기기
            </button>
          </div>
          <div className="space-y-4">
            {condolences.map((item, idx) => (
              <div key={idx} className="border-l-2 border-gray-200 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 text-sm">{item.name}</span>
                  <span className="text-xs text-gray-400">{item.time}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="max-w-xl mx-auto grid grid-cols-3 divide-x">
          <button 
            onClick={() => setShowDonation(true)}
            className="flex flex-col items-center gap-2 py-5 hover:bg-gray-50"
          >
            <Heart size={20} className="text-gray-700" />
            <span className="text-xs text-gray-700">부의금</span>
          </button>
          <button 
            onClick={() => setShowFlower(true)}
            className="flex flex-col items-center gap-2 py-5 hover:bg-gray-50"
          >
            <Flower size={20} className="text-gray-700" />
            <span className="text-xs text-gray-700">근조화환</span>
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: '부고', url: window.location.href });
              } else {
                alert('링크가 복사되었습니다.');
              }
            }}
            className="flex flex-col items-center gap-2 py-5 hover:bg-gray-50"
          >
            <Share2 size={20} className="text-gray-700" />
            <span className="text-xs text-gray-700">공유하기</span>
          </button>
        </div>
      </div>

      {/* 모달 */}
      {showCondolence && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-md w-full p-8">
            <h3 className="text-sm mb-6 text-gray-900">조문글 남기기</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="성함" 
                className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" 
              />
              <textarea 
                placeholder="조문글" 
                className="w-full bg-white border border-gray-300 px-4 py-3 h-32 resize-none text-sm focus:outline-none focus:border-gray-900"
              ></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCondolence(false)} 
                className="flex-1 border border-gray-300 py-3 text-sm hover:bg-gray-50"
              >
                취소
              </button>
              <button 
                onClick={() => { alert('등록되었습니다.'); setShowCondolence(false); }} 
                className="flex-1 bg-gray-900 text-white py-3 text-sm hover:bg-gray-800"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부의금/화환 모달도 동일한 스타일 적용 */}
      {showDonation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-md w-full p-8">
            <h3 className="text-sm mb-6 text-gray-900">부의금 보내기</h3>
            <div className="space-y-4">
              <input type="text" placeholder="보내시는 분" className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
              <input type="number" placeholder="금액" className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
              <input type="tel" placeholder="연락처" className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDonation(false)} className="flex-1 border border-gray-300 py-3 text-sm hover:bg-gray-50">취소</button>
              <button className="flex-1 bg-gray-900 text-white py-3 text-sm hover:bg-gray-800">결제하기</button>
            </div>
          </div>
        </div>
      )}

      {showFlower && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white max-w-md w-full p-8">
            <h3 className="text-sm mb-6 text-gray-900">근조화환 주문</h3>
            <div className="space-y-4">
              <input type="text" placeholder="보내시는 분" className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
              <select className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900">
                <option>고급형 (150,000원)</option>
                <option>일반형 (100,000원)</option>
                <option>근조화분 (80,000원)</option>
              </select>
              <input type="tel" placeholder="연락처" className="w-full bg-white border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-gray-900" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowFlower(false)} className="flex-1 border border-gray-300 py-3 text-sm hover:bg-gray-50">취소</button>
              <button className="flex-1 bg-gray-900 text-white py-3 text-sm hover:bg-gray-800">주문하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
