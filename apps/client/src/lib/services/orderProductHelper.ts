// 주문 페이지 DB 연동 헬퍼
import { getProductsByCategory } from '@/lib/services/productService'
import { mapToClientCategory } from '@/lib/constants/categoryMapping'

// DB 상품을 Client UI 형식으로 변환
export async function loadClientUICategories() {
  try {
    const products = await getProductsByCategory()
    
    return {
      '근조화환': {
        displayName: '근조화환',
        backendCategory: '장례식 화환',
        icon: '🏵️',
        products: (products['근조화환'] || []).map((p: any) => ({
          id: p.id,
          name: p.floristName || p.name,
          price: p.floristPrice || p.price,
          grade: p.grade,
          description: ''
        })),
        ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다', '삼가 조의를 표합니다']
      },
      '축하화환': {
        displayName: '축하화환',
        backendCategory: '개업.행사',
        icon: '🎊',
        products: (products['축하화환'] || []).map((p: any) => ({
          id: p.id,
          name: p.floristName || p.name,
          price: p.floristPrice || p.price,
          grade: p.grade,
          description: ''
        })),
        ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요', '축하합니다', '결혼을 축하합니다']
      },
      '화분·난': {
        displayName: '화분·난',
        backendCategory: '개업.행사',
        icon: '🪴',
        products: (products['화분·난'] || []).map((p: any) => ({
          id: p.id,
          name: p.floristName || p.name,
          price: p.floristPrice || p.price,
          grade: null,
          description: ''
        })),
        ribbonTemplates: ['개업을 축하합니다', '번창하세요', '승진을 축하합니다', '무궁한 발전을 빕니다']
      },
      '꽃상품': {
        displayName: '꽃상품',
        backendCategory: '승진.기념일',
        icon: '💐',
        products: (products['꽃상품'] || []).map((p: any) => ({
          id: p.id,
          name: p.floristName || p.name,
          price: p.floristPrice || p.price,
          grade: null,
          description: ''
        })),
        ribbonTemplates: ['축하합니다', '사랑합니다', '감사합니다', '생일 축하합니다']
      }
    }
  } catch (error) {
    console.error('Failed to load products from DB:', error)
    // 하드코딩 폴백
    return {
      '근조화환': {
        displayName: '근조화환',
        backendCategory: '장례식 화환',
        icon: '🏵️',
        products: [
          { id: 'FW-E', name: '근조화환 실속형', price: 45000, grade: '실속', description: '' },
          { id: 'FW-B', name: '근조화환 기본형', price: 60000, grade: '기본', description: '' },
          { id: 'FW-S', name: '근조화환 대형', price: 70000, grade: '대', description: '' },
          { id: 'FW-P', name: '근조화환 특대형', price: 80000, grade: '특대', description: '' }
        ],
        ribbonTemplates: ['삼가 고인의 명복을 빕니다']
      },
      '축하화환': {
        displayName: '축하화환', 
        backendCategory: '개업.행사',
        icon: '🎊',
        products: [
          { id: 'CW-E', name: '축하화환 실속형', price: 45000, grade: '실속', description: '' },
          { id: 'CW-B', name: '축하화환 기본형', price: 60000, grade: '기본', description: '' },
          { id: 'CW-S', name: '축하화환 대형', price: 70000, grade: '대', description: '' },
          { id: 'CW-P', name: '축하화환 특대형', price: 80000, grade: '특대', description: '' }
        ],
        ribbonTemplates: ['개업을 축하합니다', '번창하세요']
      }
    }
  }
}
