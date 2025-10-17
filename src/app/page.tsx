export const dynamic = 'force-dynamic'
export const revalidate = 0

import ModernHero from '../components/ModernHero'
import EmotionalNavbar from '../components/EmotionalNavbar'
import ModernSection from '../components/ModernSection'
import PWAInstallPrompt from '../components/PWAInstallPrompt'
import { getProductsByCategory } from '../services/productService'

export default async function HomePage() {
  // DB에서 카테고리별 상품 가져오기
  const [weddingProducts, funeralProducts, openingProducts] = await Promise.all([
    getProductsByCategory('wedding'),
    getProductsByCategory('funeral'),
    getProductsByCategory('opening')
  ])

  return (
    <main className="bg-white">
      <EmotionalNavbar />
      <ModernHero />
      <PWAInstallPrompt />
      
      {/* 결혼식화환 섹션 */}
      <div className="mt-8 md:mt-0">
        <ModernSection 
          title="결혼식화환"
          subtitle="영원한 사랑을 화환으로 전하세요"
          products={weddingProducts}
          bgColor="bg-gray-50"
        />
      </div>
      
      {/* 근조화환 섹션 */}
      <ModernSection 
        title="근조화환"
        subtitle="깊은 애도를 화환으로 전합니다"
        products={funeralProducts}
        bgColor="bg-white"
      />
      
      {/* 개업·승진·축하화환 섹션 */}
      <ModernSection 
        title="개업·승진·축하화환"
        subtitle="새로운 시작과 성공을 화환으로 축하합니다"
        products={openingProducts}
        bgColor="bg-gray-50"
      />
    </main>
  )
}