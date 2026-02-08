export const dynamic = 'force-dynamic'
export const revalidate = 0

import ModernHero from '../components/ModernHero'
import EmotionalNavbar from '../components/EmotionalNavbar'
import ModernSection from '../components/ModernSection'
import PWAInstallPrompt from '../components/PWAInstallPrompt'
import { getProductsByCategory } from '../services/productService'

export default async function HomePage() {
  // DB에서 카테고리별 상품 가져오기
  const [weddingProducts, funeralProducts, openingProducts, anniversaryProducts] = await Promise.all([
    getProductsByCategory('wedding'),
    getProductsByCategory('funeral'),
    getProductsByCategory('opening'),
    getProductsByCategory('anniversary')
  ])

  return (
    <main className="bg-white">
      <EmotionalNavbar />
      <ModernHero />
      <PWAInstallPrompt />
      
      {/* 결혼식 섹션 */}
      <div className="mt-8 md:mt-0">
        <ModernSection 
          title="결혼식"
          subtitle="영원한 사랑을 전하세요"
          products={weddingProducts}
          bgColor="bg-gray-50"
        />
      </div>
      
      {/* 장례식 섹션 */}
      <ModernSection 
        title="장례식"
        subtitle="깊은 애도를 전합니다"
        products={funeralProducts}
        bgColor="bg-white"
      />
      
      {/* 개업·행사 섹션 */}
      <ModernSection 
        title="개업·행사"
        subtitle="새로운 시작과 성공을 응원합니다"
        products={openingProducts}
        bgColor="bg-gray-50"
      />
      
      {/* 승진·기념일 섹션 */}
      <ModernSection 
        title="승진·기념일"
        subtitle="특별한 날을 축하합니다"
        products={anniversaryProducts}
        bgColor="bg-white"
      />
    </main>
  )
}
