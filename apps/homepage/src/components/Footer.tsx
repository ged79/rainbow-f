import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 border-t">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 정보 */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-gray-900 font-bold text-lg mb-4">BLOOM</h3>
            <p className="text-sm mb-2">
              대표: [대표자명] | 사업자등록번호: [000-00-00000]
            </p>
            <p className="text-sm mb-2">
              통신판매업신고: [제0000-서울강남-00000호]
            </p>
            <p className="text-sm mb-2">
              주소: [서울특별시 강남구 ○○로 123]
            </p>
            <p className="text-sm mb-2">
              이메일: support@flowerdelivery.co.kr | 고객센터: 1600-0000
            </p>
            <p className="text-xs mt-4 text-gray-500">
              BLOOM은 통신판매중개자이며, 통신판매의 당사자가 아닙니다. 
              따라서 상품 거래정보 및 거래에 대한 책임은 판매자에게 있습니다.
            </p>
          </div>

          {/* 고객 지원 */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">고객 지원</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/business" className="hover:text-gray-900 transition">
                  사업자정보확인
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gray-900 transition">
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-900 transition">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          {/* 파트너 */}
          <div>
            <h4 className="text-gray-900 font-semibold mb-4">파트너</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/partner/register" className="hover:text-gray-900 transition">
                  화원 입점신청
                </Link>
              </li>
              <li>
                <Link href="/partner/guide" className="hover:text-gray-900 transition">
                  입점 안내
                </Link>
              </li>
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

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-gray-500 mb-4 md:mb-0">
              © 2024 BLOOM. All rights reserved.
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
