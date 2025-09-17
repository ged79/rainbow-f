'use client'
import { getFloristProducts, getProductsByCategory } from '@/lib/services/productService'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore, useAppStore } from '@/stores/useStore'
import { apiService } from '@/services/api'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Package,
  CreditCard,
  Search,
  Building,
  Clock,
  Plus,
  FileText
} from 'lucide-react'
import type { 
  CreateOrderInput, 
  Store, 
  ProductType
} from '@flower/shared/types'
import { PRODUCT_CATEGORIES } from '@flower/shared/constants'

declare global {
  interface Window {
    daum: any
  }
}

// 기존 하드코딩 백업 (DB 실패시 폴백)
const CLIENT_UI_CATEGORIES_BACKUP = {
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
    ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다', '삼가 조의를 표합니다']
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
    ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요', '축하합니다']
  }
}

export default function NewOrderPageV2() {
  const router = useRouter()
  const { currentStore } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<any>({})
  const [dbProducts, setDbProducts] = useState<any[]>([])
  
  // DB에서 상품 로드
  useEffect(() => {
    loadProductsFromDB()
  }, [])

  const loadProductsFromDB = async () => {
    try {
      console.log('Loading products from DB...')
      const products = await getProductsByCategory()
      
      // DB 상품을 UI 카테고리로 변환
      const uiCategories = {
        '근조화환': {
          displayName: '근조화환',
          backendCategory: '장례식 화환',
          icon: '🏵️',
          products: products['근조화환'] || [],
          ribbonTemplates: ['삼가 고인의 명복을 빕니다', '그리운 당신을 추모합니다']
        },
        '축하화환': {
          displayName: '축하화환',
          backendCategory: '개업.행사',
          icon: '🎊',
          products: products['축하화환'] || [],
          ribbonTemplates: ['개업을 축하합니다', '번창하세요', '대박나세요']
        },
        '화분·난': {
          displayName: '화분·난',
          backendCategory: '개업.행사',
          icon: '🪴',
          products: products['화분·난'] || [],
          ribbonTemplates: ['개업을 축하합니다', '번창하세요']
        },
        '꽃상품': {
          displayName: '꽃상품',
          backendCategory: '승진.기념일',
          icon: '💐',
          products: products['꽃상품'] || [],
          ribbonTemplates: ['축하합니다', '사랑합니다', '감사합니다']
        }
      }
      
      setCategories(uiCategories)
      console.log('Products loaded:', uiCategories)
    } catch (error) {
      console.error('Failed to load products, using backup:', error)
      setCategories(CLIENT_UI_CATEGORIES_BACKUP)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">상품 로딩중...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">새 주문 (테스트 버전)</h1>
      
      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6">
        {Object.keys(categories).map(category => (
          <button
            key={category}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {categories[category].icon} {category}
          </button>
        ))}
      </div>

      {/* 상품 목록 */}
      <div className="grid grid-cols-2 gap-4">
        {Object.keys(categories).map(category => (
          <div key={category} className="border p-4 rounded-lg">
            <h3 className="font-bold mb-2">{category}</h3>
            <div className="text-sm text-gray-600">
              {categories[category].products.length}개 상품
              {categories[category].products.slice(0, 3).map((p: any) => (
                <div key={p.id}>
                  - {p.floristName || p.name}: {p.floristPrice || p.price}원
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
