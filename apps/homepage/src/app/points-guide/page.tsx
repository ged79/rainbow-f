import Link from 'next/link'
import { ArrowLeft, Gift, Users, CreditCard, TrendingUp, Info } from 'lucide-react'

export default function PointsGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">포인트 적립 안내</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 메인 혜택 카드 */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">최대 5% 포인트 적립</h2>
          <p className="text-white/90">구매 금액에 따라 포인트가 적립됩니다</p>
        </div>

        {/* 적립 방법 */}
        <section className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-rose-500" />
            포인트 적립 방법
          </h3>
          
          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold">회원가입</h4>
              <p className="text-gray-600 text-sm">가입 즉시 4,900포인트 적립</p>
              <p className="text-xs text-gray-500 mt-1">신규 회원 환영 혜택</p>
            </div>
            
            <div className="border-l-4 border-rose-500 pl-4">
              <h4 className="font-semibold">기본 구매</h4>
              <p className="text-gray-600 text-sm">구매 금액의 3% 적립</p>
              <p className="text-xs text-gray-500 mt-1">예: 100,000원 구매 시 3,000P 적립</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold">추천번호 입력 시</h4>
              <p className="text-gray-600 text-sm">구매 금액의 5% 적립</p>
              <p className="text-xs text-gray-500 mt-1">예: 100,000원 구매 시 5,000P 적립</p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold">추천인 전화번호 입력</h4>
              <p className="text-gray-600 text-sm">추천인도 구매금액의 3% 적립</p>
              <p className="text-xs text-gray-500 mt-1">적립된 포인트는 회원가입 후 사용가능</p>
              <p className="text-xs text-gray-500 mt-1">예: 100,000원 구매 시 추천인 3,000P 적립</p>
            </div>
          </div>
        </section>

        {/* 포인트 사용 */}
        <section className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            포인트 사용 방법
          </h3>
          
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-1">•</span>
              <div>
                <p className="font-medium text-gray-900">1포인트 = 1원</p>
                <p className="text-sm">결제 시 현금처럼 사용 가능</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-1">•</span>
              <div>
                <p className="font-medium text-gray-900">현금 출금</p>
                <p className="text-sm">5,000포인트 이상 보유 시 현금 출금 가능</p>
              </div>
            </li>
          </ul>
        </section>

        {/* 주의사항 */}
        <section className="bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            유의사항
          </h3>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 포인트는 구매 확정 후 적립됩니다</li>
            <li>• 취소/반품 시 사용한 포인트는 복구됩니다</li>
            <li>• 포인트 적립률은 상품별로 다를 수 있습니다</li>
            <li>• 이벤트 기간에는 추가 포인트가 적립될 수 있습니다</li>
          </ul>
        </section>

        {/* CTA 버튼 */}
        <div className="flex gap-3 pt-4">
          <Link 
            href="/signup" 
            className="flex-1 bg-rose-500 text-white text-center py-4 rounded-xl font-medium"
          >
            5% 적립받기
          </Link>
          <Link 
            href="/" 
            className="flex-1 bg-white border border-gray-200 text-center py-4 rounded-xl font-medium"
          >
            쇼핑 시작하기
          </Link>
        </div>
      </main>
    </div>
  )
}