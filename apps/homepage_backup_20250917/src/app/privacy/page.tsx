'use client'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <p className="text-gray-700 leading-relaxed mb-4">
              플라워 딜리버리(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 
              개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 
              이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. 개인정보의 수집 및 이용목적</h2>
            <p className="text-gray-700 mb-3">회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>서비스 제공:</strong> 상품 주문, 배송, 결제, 고객센터 운영</li>
              <li><strong>회원관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인식별, 불만처리 등 민원처리</li>
              <li><strong>마케팅 및 광고:</strong> 이벤트 및 광고성 정보 제공 및 참여기회 제공 (동의한 회원에 한함)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 수집하는 개인정보의 항목</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">필수항목</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>이름, 이메일, 휴대폰번호, 배송지 주소</li>
                  <li>결제정보 (카드번호, 계좌정보 등)</li>
                  <li>사업자의 경우: 사업자등록번호, 대표자명</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">선택항목</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>생년월일, 성별</li>
                  <li>관심 카테고리</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">자동 수집 항목</h3>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 개인정보의 보유 및 이용기간</h2>
            <p className="text-gray-700 mb-3">
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>회원정보:</strong> 회원 탈퇴시까지</li>
              <li><strong>전자상거래 관련:</strong> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
              <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년</li>
              <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년</li>
              <li><strong>표시/광고에 관한 기록:</strong> 6개월</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
            <p className="text-gray-700 mb-3">
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>이용자들이 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>배송업무상 배송업체에게 배송에 필요한 최소한의 이용자의 정보(성명, 주소, 전화번호)를 알려주는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. 개인정보처리의 위탁</h2>
            <p className="text-gray-700 mb-3">회사는 서비스 이행을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">위탁받는 자</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">위탁업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">전국 제휴 화원</td>
                    <td className="border border-gray-300 px-4 py-2">상품 제작 및 배송</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">PG사 (추후 선정)</td>
                    <td className="border border-gray-300 px-4 py-2">결제 처리</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">카카오/네이버</td>
                    <td className="border border-gray-300 px-4 py-2">알림톡/문자 발송</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. 정보주체의 권리·의무 및 행사방법</h2>
            <p className="text-gray-700 mb-3">이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>개인정보 열람요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제요구</li>
              <li>처리정지 요구</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. 개인정보의 파기</h2>
            <p className="text-gray-700">
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
              지체없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 
              기술적 방법을 사용하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. 개인정보의 안전성 확보조치</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>내부관리계획의 수립 및 시행</li>
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보에 대한 접근 제한</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. 개인정보보호 책임자</h2>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-gray-700"><strong>개인정보보호 책임자</strong></p>
              <p className="text-gray-700">성명: [책임자명]</p>
              <p className="text-gray-700">직위: 대표이사</p>
              <p className="text-gray-700">연락처: privacy@flowerdelivery.co.kr</p>
              <p className="text-gray-700">전화: 1600-0000</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. 쿠키의 사용</h2>
            <p className="text-gray-700">
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 
              '쿠키(cookie)'를 사용합니다. 이용자는 웹브라우저 설정을 통해 쿠키 사용을 거부할 수 있으나, 
              이 경우 서비스 이용에 어려움이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. 개인정보처리방침의 변경</h2>
            <p className="text-gray-700">
              이 개인정보처리방침은 2024년 1월 1일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 
              삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

          <div className="mt-12 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              공고일자: 2024년 1월 1일<br/>
              시행일자: 2024년 1월 1일
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
