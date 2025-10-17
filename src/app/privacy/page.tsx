'use client'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <p className="text-sm text-gray-600 mb-4">시행일: 2024년 10월 1일</p>
            <p className="text-gray-700 leading-relaxed">
              RAINBOW-F(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. 수집하는 개인정보 항목</h2>
            <div className="space-y-2 text-gray-700">
              <div>
                <h3 className="font-medium">필수항목</h3>
                <ul className="list-disc pl-6 mt-1">
                  <li>주문자 정보: 이름, 휴대전화번호</li>
                  <li>수령인 정보: 이름, 휴대전화번호, 배송지 주소</li>
                  <li>결제 정보: 결제수단 정보</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mt-3">자동 수집 항목</h3>
                <ul className="list-disc pl-6 mt-1">
                  <li>서비스 이용기록, 접속 로그, 쿠키, IP 주소</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 개인정보 수집 목적</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>서비스 제공: 꽃 배송 서비스 제공 및 계약 이행</li>
              <li>주문 처리: 구매 및 결제, 배송지 확인</li>
              <li>고객 관리: 고객 문의 응대, 공지사항 전달</li>
              <li>마케팅: 이벤트 및 광고성 정보 제공 (동의한 경우)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 개인정보 보유 및 이용기간</h2>
            <div className="text-gray-700 space-y-2">
              <p>회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-medium mb-2">관계법령에 따른 보존기간</h3>
                <ul className="space-y-1 text-sm">
                  <li>• 계약 또는 청약철회 관련 기록: 5년</li>
                  <li>• 대금결제 및 재화 등의 공급 기록: 5년</li>
                  <li>• 소비자 불만 또는 분쟁처리 기록: 3년</li>
                  <li>• 표시·광고에 관한 기록: 6개월</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
            <div className="text-gray-700">
              <p className="mb-3">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>배송업무상 배송업체에게 배송에 필요한 최소한의 정보를 제공하는 경우</li>
                <li>법령의 규정에 의거하거나, 수사기관의 요구가 있는 경우</li>
              </ul>
              <div className="mt-4 bg-blue-50 p-4 rounded">
                <p className="font-medium">화원 정보 제공</p>
                <p className="text-sm mt-1">주문 처리를 위해 담당 화원에 주문자명, 수령인 정보, 배송지 주소를 제공합니다.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 개인정보의 안전성 확보조치</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              <li>개인정보 암호화: 비밀번호 등 중요 정보는 암호화하여 저장</li>
              <li>해킹 등에 대비한 기술적 대책: 보안프로그램 설치 및 주기적 갱신</li>
              <li>개인정보 접근 제한: 최소한의 인원으로 제한</li>
              <li>개인정보보호 교육 실시</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 이용자의 권리</h2>
            <div className="text-gray-700">
              <p className="mb-3">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 쿠키(Cookie) 운영</h2>
            <p className="text-gray-700">
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키를 사용합니다. 
              이용자는 웹브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 
              이 경우 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 개인정보보호 책임자</h2>
            <div className="bg-gray-50 p-4 rounded text-gray-700">
              <p><span className="font-medium">책임자:</span> 김영아</p>
              <p><span className="font-medium">직책:</span> 대표</p>
              <p><span className="font-medium">연락처:</span> 010-7741-4569</p>
              <p><span className="font-medium">이메일:</span> lunggal@naver.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. 개인정보처리방침 변경</h2>
            <p className="text-gray-700">
              이 개인정보처리방침은 2024년 10월 1일부터 적용되며, 
              법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통해 고지할 것입니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
