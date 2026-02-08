'use client'

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">환불 및 교환 정책</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <p className="text-sm text-gray-600 mb-4">최종 수정일: 2025년 10월 1일</p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <span className="font-semibold">중요:</span> 꽃은 신선도가 중요한 상품 특성상 단순 변심에 의한 환불이 제한됩니다. 
                주문 전 신중한 구매 결정을 부탁드립니다.
              </p>
            </div>
          </section>

          {/* 배송 소요시간 섹션 추가 */}
          <section>
            <h2 className="text-xl font-semibold mb-3">배송 소요시간</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><span className="font-semibold">당일배송:</span> 주문 후 3~6시간 이내 배송</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><span className="font-semibold">예약배송:</span> 지정 시간으로부터 3~6시간 이내 배송</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><span className="font-semibold">최대 배송기간:</span> 1일 이내</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. 청약철회 및 계약해제</h2>
            <div className="text-gray-700 space-y-3">
              <div>
                <h3 className="font-medium mb-2">청약철회 가능 기간</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>배송 예정일 <span className="font-semibold text-red-600">1일 전까지</span> 주문 취소 가능</li>
                  <li>당일 배송 상품: 주문 후 <span className="font-semibold">3시간 이내</span></li>
                  <li>예약 배송 상품: 배송일 24시간 전까지</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium mb-1">취소 수수료</p>
                <ul className="text-sm space-y-1">
                  <li>• 배송 2일 전: 100% 환불</li>
                  <li>• 배송 1일 전: 90% 환불</li>
                  <li>• 배송 당일: 환불 불가</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 환불 가능 사유</h2>
            <div className="text-gray-700">
              <h3 className="font-medium mb-2 text-green-600">✓ 환불 가능한 경우</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <span className="font-medium">상품 하자:</span> 
                  <span className="text-sm">시든 꽃, 부러진 줄기, 주문과 다른 꽃 종류</span>
                </li>
                <li>
                  <span className="font-medium">배송 문제:</span>
                  <span className="text-sm">지정일 미배송, 잘못된 주소 배송 (당사 과실)</span>
                </li>
                <li>
                  <span className="font-medium">주문 오류:</span>
                  <span className="text-sm">주문 내용과 다른 상품 배송</span>
                </li>
                <li>
                  <span className="font-medium">품질 문제:</span>
                  <span className="text-sm">배송 직후 확인된 심각한 품질 불량</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 환불 불가 사유</h2>
            <div className="text-gray-700">
              <h3 className="font-medium mb-2 text-red-600">✗ 환불 불가한 경우</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>고객의 단순 변심</li>
                <li>수령인 부재로 인한 상품 변질</li>
                <li>고객이 제공한 잘못된 배송 정보</li>
                <li>배송 완료 후 3일 경과</li>
                <li>화환 설치 완료 후</li>
                <li>고객 과실로 인한 상품 훼손</li>
                <li>이미지와의 미세한 차이 (꽃은 자연상품으로 개체 차이 존재)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 교환 정책</h2>
            <div className="text-gray-700 space-y-3">
              <div>
                <h3 className="font-medium mb-2">교환 가능 조건</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>배송 완료 후 <span className="font-semibold">24시간 이내</span> 신청</li>
                  <li>상품 하자가 명확히 인정되는 경우</li>
                  <li>사진 증빙 필수</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded">
                <p className="font-medium mb-2">교환 절차</p>
                <ol className="text-sm space-y-1">
                  <li>1. 고객센터 연락 (010-7741-4569)</li>
                  <li>2. 상품 사진 전송</li>
                  <li>3. 교환 승인 확인</li>
                  <li>4. 익일 재배송 (당일 재배송 불가)</li>
                </ol>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 환불 절차</h2>
            <div className="text-gray-700">
              <ol className="space-y-3">
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                  <div>
                    <p className="font-medium">환불 신청</p>
                    <p className="text-sm text-gray-600">고객센터 전화 또는 카카오톡 문의</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                  <div>
                    <p className="font-medium">증빙 자료 제출</p>
                    <p className="text-sm text-gray-600">문제 상품 사진 촬영 및 전송</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                  <div>
                    <p className="font-medium">검토 및 승인</p>
                    <p className="text-sm text-gray-600">영업일 기준 1-2일 소요</p>
                  </div>
                </li>
                <li className="flex">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
                  <div>
                    <p className="font-medium">환불 처리</p>
                    <p className="text-sm text-gray-600">승인 후 3-5영업일 내 원 결제수단으로 환불</p>
                  </div>
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 특별 규정</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium mb-1">근조화환</h3>
                <p className="text-sm text-gray-700">
                  장례식장 특성상 설치 완료 후에는 교환/환불이 불가합니다.
                  배송 전 연락처 및 장례식장 정보를 정확히 확인해 주세요.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium mb-1">축하화환</h3>
                <p className="text-sm text-gray-700">
                  행사장 설치 완료 후 위치 변경은 추가 비용이 발생할 수 있습니다.
                </p>
              </div>
              
              <div className="border-l-4 border-pink-500 pl-4">
                <h3 className="font-medium mb-1">꽃다발/꽃바구니</h3>
                <p className="text-sm text-gray-700">
                  수령 후 보관 방법에 따라 품질이 달라질 수 있으며,
                  이는 환불 사유가 되지 않습니다.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 소비자 피해 보상</h2>
            <div className="bg-gray-50 p-4 rounded text-gray-700">
              <p className="mb-2">
                상품의 불량 또는 당사의 과실로 인한 피해는 
                「소비자기본법」 제16조 및 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 보상합니다.
              </p>
              <ul className="text-sm space-y-1 mt-3">
                <li>• 한국소비자원: 1372</li>
                <li>• 공정거래위원회: 044-200-4010</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 고객센터</h2>
            <div className="bg-blue-50 p-6 rounded text-center">
              <p className="text-2xl font-bold text-blue-600 mb-2">010-7741-4569</p>
              <p className="text-gray-700">운영시간: 평일 09:00 - 18:00</p>
              <p className="text-sm text-gray-600 mt-1">주말/공휴일 카카오톡 문의 가능</p>
              <p className="mt-3">
                <span className="font-medium">이메일:</span> conexus25@conexus.co.kr
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
