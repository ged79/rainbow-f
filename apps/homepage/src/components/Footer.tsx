import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-200 text-gray-700 border-t">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-gray-900 font-bold text-lg mb-4">RAINBOW-F (코넥서스)</h3>
            <p className="text-sm mb-2">
              대표: 김영아 | 사업자등록번호: 853-81-03832
            </p>
            <p className="text-sm mb-2">
              통신판매업신고: 제 2025-충북영동-075 호
            </p>
            <p className="text-sm mb-2">
              업종: 전자상거래, 정보통신업, 소프트웨어 개발 및 공급
            </p>
            <p className="text-sm mb-2">
              주소: 충북 영동군 영동읍 눈어치4로 4, 201
            </p>
            <p className="text-sm mb-2">
              이메일: conexus25@conexus.co.kr | 전화: 010-7741-4569
            </p>
            <p className="text-xs mt-4 text-gray-600">
              RAINBOW-F는 통신판매중개자이며, 통신판매의 당사자가 아닙니다. 
              따라서 상품 거래정보 및 거래에 대한 책임은 판매자에게 있습니다.
            </p>
          </div>

          {/* 고객 지원과 파트너 - 모바일에서 2열로 */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">
            {/* 고객 지원 */}
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">고객 지원</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=8538103832" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-gray-900 transition"
                  >
                    사업자정보확인
                  </a>
                </li>
              </ul>
            </div>

            {/* 파트너 */}
            <div>
              <h4 className="text-gray-900 font-semibold mb-4">파트너</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/client/login" className="hover:text-gray-900 transition">
                    화원 로그인
                  </a>
                </li>
                <li>
                  <a href="/admin/login" className="hover:text-gray-900 transition">
                    관리자
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-600 mb-4 md:mb-0">
              © 2024 RAINBOW-F (코넥서스). All rights reserved.
            </p>
            <div className="flex space-x-6 text-xs">
              <Link href="/terms" className="hover:text-gray-900 transition">이용약관</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition font-semibold">개인정보처리방침</Link>
              <Link href="/refund" className="hover:text-gray-900 transition">청약철회 및 환불</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
