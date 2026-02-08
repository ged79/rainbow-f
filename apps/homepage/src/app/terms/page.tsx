'use client'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">이용약관</h1>
        
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">제1조 (목적)</h2>
            <p className="text-gray-700 leading-relaxed">
              본 약관은 플라워 딜리버리(이하 "회사")가 운영하는 온라인 플랫폼(이하 "서비스")에서 제공하는 
              전자상거래 관련 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제2조 (정의)</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>"서비스"란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.</li>
              <li>"이용자"란 서비스에 접속하여 이 약관에 따라 서비스가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
              <li>"화원"이란 서비스를 통해 상품을 판매하는 사업자를 말합니다.</li>
              <li>"회원"이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며, 서비스가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제3조 (약관의 게시와 개정)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 
              「전자문서 및 전자거래기본법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 
              「소비자기본법」 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제4조 (서비스의 제공 및 변경)</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>꽃 및 화훼 상품의 주문 중개 서비스</li>
              <li>배송 서비스</li>
              <li>기타 회사가 정하는 업무</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제5조 (서비스의 중단)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 
              서비스의 제공을 일시적으로 중단할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제6조 (회원가입)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제7조 (통신판매중개서비스)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              회사는 통신판매중개자로서 거래당사자가 아니며, 판매자가 등록한 상품정보 및 거래에 대한 책임은 해당 판매자가 부담합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              회사는 구매자와 판매자 간의 거래를 중개하는 시스템을 제공할 뿐, 구매자 또는 판매자를 대리하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제8조 (구매신청 및 결제)</h2>
            <p className="text-gray-700 leading-relaxed">
              이용자는 서비스상에서 다음 또는 이와 유사한 방법에 의하여 구매를 신청하며, 
              회사는 이용자가 구매신청을 함에 있어서 다음의 각 내용을 알기 쉽게 제공하여야 합니다.
            </p>
            <ul className="list-decimal pl-6 mt-2 space-y-1 text-gray-700">
              <li>재화 등의 검색 및 선택</li>
              <li>받는 사람의 성명, 주소, 전화번호 입력</li>
              <li>약관내용, 청약철회권이 제한되는 서비스 확인</li>
              <li>결제방법의 선택</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제9조 (배송)</h2>
            <p className="text-gray-700 leading-relaxed">
              화원은 이용자가 구매한 재화에 대해 배송수단, 수단별 배송비용 부담자, 
              수단별 배송기간 등을 명시합니다. 화원이 약정 배송기간을 초과한 경우에는 
              그로 인한 이용자의 손해를 배상하여야 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제10조 (환급, 반품 및 교환)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 이용자가 구매 신청한 재화 등이 품절 등의 사유로 인도 또는 제공을 할 수 없을 때에는 
              지체 없이 그 사유를 이용자에게 통지하고 사전에 재화 등의 대금을 받은 경우에는 
              대금을 받은 날부터 3영업일 이내에 환급하거나 환급에 필요한 조치를 취합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제11조 (개인정보보호)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 이용자의 정보수집시 구매계약 이행에 필요한 최소한의 정보를 수집합니다. 
              회사는 이용자의 개인식별이 가능한 개인정보를 수집하는 때에는 반드시 당해 이용자의 동의를 받습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제12조 (분쟁해결)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 
              피해보상처리기구를 설치·운영합니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              회사와 이용자간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 
              공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">제13조 (재판권 및 준거법)</h2>
            <p className="text-gray-700 leading-relaxed">
              회사와 이용자간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시 이용자의 주소에 의하고, 
              주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
            </p>
          </section>

          <div className="mt-12 p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">
              시행일: 2024년 1월 1일
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
