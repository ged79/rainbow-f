'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Share2, Heart, Flower } from 'lucide-react';

export default function ClassicObituary() {
  const [showCondolence, setShowCondolence] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showDonation, setShowDonation] = useState(false);

  const obituaryData = {
    deceased: {
      name: '홍길동',
      hanja: '洪吉童',
      religion: '천주교 세례명 요한',
      age: '향년 75세',
      deathDate: '2025년 10월 3일',
    },
    schedule: {
      placement: '2025년 10월 4일 (금) 10:00',
      casket: '2025년 10월 6일 (일) 14:00',
      funeral: '2025년 10월 7일 (월) 07:00',
      room: '1빈소 (2층)'
    },
    family: [
      { relation: '상주', name: '홍철수', phone: '010-1234-5678' },
      { relation: '장남', name: '홍민수', phone: '010-2345-6789' },
      { relation: '차남', name: '홍진수', phone: '010-3456-7890' }
    ],
    location: {
      name: '영등병원 장례식장',
      address: '서울시 양천구 신정로 123',
      phone: '02-1234-5678',
    },
    burial: {
      type: '화장',
      place: '서울추모공원'
    },
    chiefMessage: '평소 아버지께서 보여주신 사랑과 은혜에 감사드리며\n삼가 고인의 명복을 빕니다.\n\n마지막 가시는 길 함께해 주시기 바랍니다.',
    condolences: [
      { name: '김영희', message: '삼가 고인의 명복을 빕니다.', time: '2시간 전' },
      { name: '이철수', message: '좋은 곳으로 가셨기를 기원합니다.', time: '5시간 전' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 - 전통 한자 스타일 */}
      <div className="bg-black text-white py-8 border-b-4 border-gray-700">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="text-6xl font-serif mb-4 tracking-wider">訃告</div>
          <div className="w-32 h-0.5 bg-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-300 text-sm tracking-widest">삼가 고인의 명복을 빕니다</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-24 px-4">
        {/* 영정 및 고인정보 - 전통적 레이아웃 */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 mt-6 border-2 border-gray-700">
          <div className="p-8">
            {/* 국화 장식 */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏵️</div>
            </div>

            {/* 영정사진 */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-56 h-72 bg-gradient-to-br from-gray-700 to-gray-800 border-8 border-gray-700 shadow-2xl flex items-center justify-center">
                  <span className="text-gray-500 text-sm">영정사진</span>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border-2 border-gray-600 px-6 py-2">
                  <span className="text-white text-xs tracking-widest">故人</span>
                </div>
              </div>
            </div>

            {/* 고인 정보 - 세로쓰기 느낌 */}
            <div className="text-center space-y-3 mt-8">
              <h2 className="text-5xl font-bold text-white mb-2 tracking-wide">{obituaryData.deceased.name}</h2>
              <p className="text-gray-400 text-lg font-serif tracking-widest">{obituaryData.deceased.hanja}</p>
              <div className="w-24 h-0.5 bg-gray-600 mx-auto my-4"></div>
              <p className="text-gray-300 text-xl tracking-wide">{obituaryData.deceased.religion}</p>
              <p className="text-gray-200 text-2xl font-medium tracking-wide mt-2">{obituaryData.deceased.age}</p>
            </div>
          </div>
        </div>

        {/* 일정 - 전통 문서 스타일 */}
        <div className="bg-gray-800 mt-6 border-2 border-gray-700 p-6">
          <div className="border-b border-gray-700 pb-3 mb-5">
            <h3 className="text-white text-xl font-bold text-center tracking-widest">◆ 일정 안내 ◆</h3>
          </div>
          <div className="space-y-4 text-gray-200">
            <div className="flex border-b border-gray-700 pb-3">
              <span className="text-gray-400 w-28 tracking-wide">별세</span>
              <span className="tracking-wide">{obituaryData.deceased.deathDate}</span>
            </div>
            <div className="flex border-b border-gray-700 pb-3">
              <span className="text-gray-400 w-28 tracking-wide">입실</span>
              <span className="tracking-wide">{obituaryData.schedule.placement}</span>
            </div>
            <div className="flex border-b border-gray-700 pb-3">
              <span className="text-gray-400 w-28 tracking-wide">입관</span>
              <span className="tracking-wide">{obituaryData.schedule.casket}</span>
            </div>
            <div className="bg-amber-900/30 border-2 border-amber-700 p-4 rounded">
              <div className="flex">
                <span className="text-amber-300 w-28 tracking-wide font-bold">발인</span>
                <div>
                  <div className="text-amber-100 font-bold tracking-wide">{obituaryData.schedule.funeral}</div>
                  <div className="text-amber-200 text-sm mt-1 tracking-wide">{obituaryData.schedule.room}</div>
                </div>
              </div>
            </div>
            <div className="flex border-b border-gray-700 pb-3">
              <span className="text-gray-400 w-28 tracking-wide">장지</span>
              <div>
                <div className="tracking-wide">{obituaryData.burial.type}</div>
                <div className="text-gray-400 text-sm mt-0.5 tracking-wide">{obituaryData.burial.place}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 장례식장 */}
        <div className="bg-gray-800 mt-6 border-2 border-gray-700 p-6">
          <div className="border-b border-gray-700 pb-3 mb-5">
            <h3 className="text-white text-xl font-bold text-center tracking-widest">◆ 장례식장 ◆</h3>
          </div>
          <div className="space-y-4">
            <p className="text-white text-2xl font-bold text-center tracking-wide mb-4">{obituaryData.location.name}</p>
            <div className="space-y-3 text-gray-200">
              <div className="flex items-start gap-3 border-b border-gray-700 pb-3">
                <MapPin size={18} className="text-gray-400 mt-1 shrink-0" />
                <span className="tracking-wide">{obituaryData.location.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-400 shrink-0" />
                <a href={`tel:${obituaryData.location.phone}`} className="text-blue-400 hover:underline tracking-wide">
                  {obituaryData.location.phone}
                </a>
              </div>
            </div>
            <div className="h-48 bg-gray-900 border border-gray-700 rounded flex items-center justify-center mt-4">
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded border border-gray-600 tracking-wide">
                지도 보기
              </button>
            </div>
          </div>
        </div>

        {/* 유가족 */}
        <div className="bg-gray-800 mt-6 border-2 border-gray-700 p-6">
          <div className="border-b border-gray-700 pb-3 mb-5">
            <h3 className="text-white text-xl font-bold text-center tracking-widest">◆ 상주 ◆</h3>
          </div>
          <div className="space-y-2">
            {obituaryData.family.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-6">
                  <span className="text-gray-400 w-14 tracking-wide">{member.relation}</span>
                  <span className="text-white font-medium tracking-wide">{member.name}</span>
                </div>
                <a href={`tel:${member.phone}`} className="text-blue-400 hover:underline tracking-wide">
                  {member.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* 상주 말씀 */}
        <div className="bg-gradient-to-b from-amber-900/20 to-amber-950/20 mt-6 border-2 border-amber-800/50 p-6">
          <div className="border-b border-amber-700/50 pb-3 mb-5">
            <h3 className="text-amber-200 text-xl font-bold text-center tracking-widest">◆ 상주 말씀 ◆</h3>
          </div>
          <p className="text-gray-200 leading-loose whitespace-pre-wrap text-center tracking-wide">
            {obituaryData.chiefMessage}
          </p>
        </div>

        {/* 전하는 말 */}
        <div className="bg-gray-800 mt-6 border-2 border-gray-700 p-6">
          <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-5">
            <h3 className="text-white text-xl font-bold tracking-widest">◆ 전하는 말 ◆</h3>
            <button 
              onClick={() => setShowCondolence(true)}
              className="text-sm text-blue-400 hover:text-blue-300 tracking-wide"
            >
              + 글 남기기
            </button>
          </div>
          <div className="space-y-3">
            {obituaryData.condolences.map((item, idx) => (
              <div key={idx} className="bg-gray-900 border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium tracking-wide">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed tracking-wide">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-gray-700 shadow-2xl z-50">
        <div className="max-w-2xl mx-auto grid grid-cols-3 divide-x divide-gray-700">
          <button 
            onClick={() => setShowDonation(true)}
            className="flex flex-col items-center gap-2 py-4 hover:bg-gray-800 transition-colors"
          >
            <Heart size={24} className="text-green-400" />
            <span className="text-sm font-medium text-white tracking-wide">부의금</span>
          </button>
          <button 
            onClick={() => setShowFlower(true)}
            className="flex flex-col items-center gap-2 py-4 hover:bg-gray-800 transition-colors"
          >
            <Flower size={24} className="text-purple-400" />
            <span className="text-sm font-medium text-white tracking-wide">근조화환</span>
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: '부고', url: window.location.href });
              } else {
                alert('링크가 복사되었습니다.');
              }
            }}
            className="flex flex-col items-center gap-2 py-4 hover:bg-gray-800 transition-colors"
          >
            <Share2 size={24} className="text-blue-400" />
            <span className="text-sm font-medium text-white tracking-wide">공유하기</span>
          </button>
        </div>
      </div>

      {/* 모달들은 이전과 동일하게 유지 */}
      {showCondolence && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border-2 border-gray-700 rounded-lg max-w-md w-full p-6">
            <h3 className="font-bold text-xl mb-5 text-white tracking-wide">조문글 남기기</h3>
            <div className="space-y-4">
              <input type="text" placeholder="성함" className="w-full bg-gray-900 border border-gray-700 text-white rounded px-4 py-3" />
              <textarea placeholder="조문글" className="w-full bg-gray-900 border border-gray-700 text-white rounded px-4 py-3 h-32 resize-none"></textarea>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCondolence(false)} className="flex-1 bg-gray-700 text-white py-3 rounded hover:bg-gray-600">취소</button>
              <button onClick={() => { alert('등록되었습니다.'); setShowCondolence(false); }} className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700">등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
