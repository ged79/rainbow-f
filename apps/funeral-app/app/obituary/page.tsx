'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Share2, Heart, Flower, ChevronRight, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ObituaryPage() {
  const [showCondolence, setShowCondolence] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [obituaryData, setObituaryData] = useState<any>(null);
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');

  useEffect(() => {
    // sessionStorage에서 데이터 가져오기 (우선)
    const storedData = sessionStorage.getItem('obituaryData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setObituaryData(formatObituaryData(data));
    } else if (roomId) {
      // localStorage에서 데이터 가져오기
      const funerals = localStorage.getItem('funerals');
      if (funerals) {
        const allFunerals = JSON.parse(funerals);
        const funeral = allFunerals.find((f: any) => f.room_id === roomId);
        if (funeral) {
          setObituaryData(formatObituaryData(funeral));
        }
      }
    }
  }, [roomId]);

  const formatObituaryData = (data: any) => {
    return {
      ...data,
      deceased: {
        name: data.deceased_name || '',
        hanja: data.deceased_hanja || '',
        religion: data.religion ? `${data.religion} ${data.religion_title || ''}` : '',
        age: data.age ? `향년 ${data.age}세` : '',
        deathDate: data.death_date || '',
        photo: data.photo_url || null
      },
      schedule: {
        placement: data.placement_time || '',
        casket: data.casket_time || '',
        funeral: data.funeral_time || '',
        room: data.room_name || '특실 5빈소',
        floor: data.floor || '5층'
      },
      family: data.family_members || [],
      location: {
        name: '영동병원 장례식장',
        address: '충청북도 영동군 영동읍 대학로 106',
        phone: '043-740-1004',
        parking: '지하 1~3층 주차 가능',
        mapUrl: 'https://map.naver.com'
      },
      burial: {
        type: data.burial_type || '',
        place: data.burial_location || ''
      },
      bankInfo: {
        bank: data.bank_name || '',
        account: data.account_number || '',
        holder: data.account_holder || ''
      },
      chiefMessage: data.chief_mourner_message || '삼가 고인의 명복을 빕니다.',
      condolences: []
    };
  };

  if (!obituaryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">부고 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-block px-4 py-1.5 bg-gray-900 text-white text-sm mb-3 rounded-full">
              訃 告
            </div>
            <p className="text-gray-600 text-sm">삼가 고인의 명복을 빕니다</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-24">
        {/* 영정사진 & 고인정보 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col items-center">
              {/* 영정사진 */}
              <div className="relative mb-6">
                <div className="w-48 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {obituaryData.deceased.photo ? (
                    <img src={obituaryData.deceased.photo} alt="영정사진" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">영정사진</span>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-md border">
                  <span className="text-xs text-gray-600">🕯️ 영면</span>
                </div>
              </div>

              {/* 고인 정보 */}
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-bold text-gray-900 mb-1">{obituaryData.deceased.name}</h2>
                {obituaryData.deceased.hanja && (
                  <p className="text-gray-500 text-base">{obituaryData.deceased.hanja}</p>
                )}
                {obituaryData.deceased.religion && (
                  <p className="text-gray-700 text-lg">{obituaryData.deceased.religion}</p>
                )}
                {obituaryData.deceased.age && (
                  <p className="text-xl text-gray-600 font-medium pt-1">{obituaryData.deceased.age}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 일정 정보 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b">
            <Clock size={20} className="text-gray-700" />
            <h3 className="font-bold text-lg text-gray-900">일정 안내</h3>
          </div>
          <div className="space-y-4">
            {obituaryData.deceased.deathDate && (
              <div className="flex items-start">
                <span className="text-gray-500 w-20 text-sm pt-0.5">별세</span>
                <span className="font-medium text-gray-900">{obituaryData.deceased.deathDate}</span>
              </div>
            )}
            {obituaryData.schedule.placement && (
              <div className="flex items-start">
                <span className="text-gray-500 w-20 text-sm pt-0.5">입실</span>
                <span className="font-medium text-gray-900">{obituaryData.schedule.placement}</span>
              </div>
            )}
            {obituaryData.schedule.casket && (
              <div className="flex items-start">
                <span className="text-gray-500 w-20 text-sm pt-0.5">입관</span>
                <span className="font-medium text-gray-900">{obituaryData.schedule.casket}</span>
              </div>
            )}
            {obituaryData.schedule.funeral && (
              <div className="flex items-start bg-amber-50 -mx-2 px-2 py-3 rounded-lg">
                <span className="text-amber-800 w-20 text-sm pt-0.5 font-semibold">발인</span>
                <div>
                  <div className="font-bold text-amber-900">{obituaryData.schedule.funeral}</div>
                  <div className="text-sm text-amber-700 mt-1">{obituaryData.schedule.room} ({obituaryData.schedule.floor})</div>
                </div>
              </div>
            )}
            {obituaryData.burial.place && (
              <div className="flex items-start">
                <span className="text-gray-500 w-20 text-sm pt-0.5">장지</span>
                <div>
                  {obituaryData.burial.type && (
                    <div className="font-medium text-gray-900">{obituaryData.burial.type}</div>
                  )}
                  <div className="text-sm text-gray-600 mt-0.5">{obituaryData.burial.place}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 장례식장 정보 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b">
            <MapPin size={20} className="text-gray-700" />
            <h3 className="font-bold text-lg text-gray-900">장례식장</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="font-bold text-xl text-gray-900 mb-3">{obituaryData.location.name}</p>
              <div className="space-y-2.5 text-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="mt-0.5 text-gray-500 shrink-0" />
                  <span className="text-sm">{obituaryData.location.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-500 shrink-0" />
                  <a href={`tel:${obituaryData.location.phone}`} className="text-sm text-blue-600 hover:underline">
                    {obituaryData.location.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-sm">🅿️</span>
                  <span className="text-sm text-gray-600">{obituaryData.location.parking}</span>
                </div>
              </div>
            </div>
            
            {/* 지도 */}
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden">
              <button 
                onClick={() => window.open(obituaryData.location.mapUrl, '_blank')}
                className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
              >
                <div className="bg-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <MapPin size={20} />
                    <span>지도 보기</span>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 유가족 */}
        {obituaryData.family && obituaryData.family.length > 0 && (
          <div className="bg-white mt-4 mx-4 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-4 pb-3 border-b text-gray-900">상주</h3>
            <div className="space-y-1">
              {obituaryData.family.map((member: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm w-12">{member.relation}</span>
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </div>
                  {member.phone && (
                    <a 
                      href={`tel:${member.phone}`} 
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {member.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 부의금 계좌정보 */}
        {obituaryData.bankInfo && obituaryData.bankInfo.bank && (
          <div className="bg-amber-50 mt-4 mx-4 rounded-2xl shadow-sm p-6 border border-amber-200">
            <h3 className="font-bold text-lg mb-4 text-gray-900">부의금 계좌</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-gray-600 w-20 text-sm">은행</span>
                <span className="font-medium text-gray-900">{obituaryData.bankInfo.bank}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-20 text-sm">계좌번호</span>
                <span className="font-medium text-gray-900">{obituaryData.bankInfo.account}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 w-20 text-sm">예금주</span>
                <span className="font-medium text-gray-900">{obituaryData.bankInfo.holder}</span>
              </div>
            </div>
          </div>
        )}

        {/* 상주 말씀 */}
        {obituaryData.chiefMessage && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 mt-4 mx-4 rounded-2xl shadow-sm p-6 border border-amber-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900">상주 말씀</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
              {obituaryData.chiefMessage}
            </p>
          </div>
        )}

        {/* 전하는 말 */}
        <div className="bg-white mt-4 mx-4 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b">
            <h3 className="font-bold text-lg text-gray-900">전하는 말</h3>
            <button 
              onClick={() => setShowCondolence(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + 글 남기기
            </button>
          </div>
          <div className="space-y-3">
            {obituaryData.condolences && obituaryData.condolences.length > 0 ? (
              obituaryData.condolences.map((item: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.time}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.message}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                아직 조문글이 없습니다
              </div>
            )}
          </div>
        </div>

        <div className="h-4"></div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 divide-x">
            <button 
              onClick={() => setShowDonation(true)}
              className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 transition-colors"
            >
              <Heart size={24} className="text-green-600" />
              <span className="text-sm font-medium text-gray-900">부의금</span>
            </button>
            <button 
              onClick={() => {
                // sessionStorage에 부고 데이터 저장
                sessionStorage.setItem('obituaryData', JSON.stringify(obituaryData));
                // 화환 주문 페이지로 이동
                window.location.href = `/obituary/flower?room=${roomId || ''}`;
              }}
              className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 transition-colors"
            >
              <Flower size={24} className="text-purple-600" />
              <span className="text-sm font-medium text-gray-900">근조화환</span>
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ 
                    title: `${obituaryData.deceased.name} 부고`, 
                    text: `${obituaryData.deceased.name}님의 부고를 전합니다.`,
                    url: window.location.href 
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('링크가 복사되었습니다.');
                }
              }}
              className="flex flex-col items-center gap-2 py-4 hover:bg-gray-50 transition-colors"
            >
              <Share2 size={24} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-900">공유하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 조문글 작성 모달 */}
      {showCondolence && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="font-bold text-xl mb-5">조문글 남기기</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">성함</label>
                <input 
                  type="text" 
                  placeholder="이름을 입력해주세요"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">조문글</label>
                <textarea 
                  placeholder="고인에게 전하는 말씀을 남겨주세요"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                ></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCondolence(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={() => {
                  alert('조문글이 등록되었습니다.');
                  setShowCondolence(false);
                }}
                className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부의금 모달 */}
      {showDonation && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-xl mb-5">부의금 보내기</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">보내시는 분</label>
                <input 
                  type="text" 
                  placeholder="이름을 입력해주세요"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">금액</label>
                <input 
                  type="number" 
                  placeholder="50000" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">연락처</label>
                <input 
                  type="tel" 
                  placeholder="010-0000-0000"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" 
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDonation(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button 
                className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
