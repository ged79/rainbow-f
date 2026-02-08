'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Heart, ArrowRight, Sparkles } from 'lucide-react'
import ProductCard from './ui/ProductCard'
import { loadFromStorage, saveToStorage } from '../lib/storage'

// 카테고리 이름을 URL 경로로 변환하는 헬퍼 함수
const getCategoryPath = (title: string): string => {
  // title 파라미터가 실제로는 "결혼식화환", "근조화환" 등으로 들어옴
  if (title.includes('결혼')) return 'wedding'
  if (title.includes('근조') || title.includes('장례')) return 'funeral'
  if (title.includes('개업') || title.includes('축하')) return 'opening'
  if (title.includes('승진') || title.includes('기념')) return 'anniversary'
  return 'opening'
}

interface SectionProps {
  title: string
  subtitle: string
  products: any[]
  bgColor: string
  isLoading?: boolean
}

export default function ModernSection({ title, subtitle, products = [], bgColor, isLoading = false }: SectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [wishlist, setWishlist] = useState<any[]>([])
  const [isDesktop, setIsDesktop] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  // localStorage 캐싱 제거 - 항상 prop products 사용
  const displayProducts = products

  
  useEffect(() => {
    setMounted(true)
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = loadFromStorage('wishlist', [])
      setWishlist(saved)
    }
  }, [])
  
  // PC용 스크롤 체크
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }
  
  useEffect(() => {
    if (isDesktop && scrollRef.current) {
      checkScrollButtons()
      scrollRef.current.addEventListener('scroll', checkScrollButtons)
      return () => {
        scrollRef.current?.removeEventListener('scroll', checkScrollButtons)
      }
    }
  }, [isDesktop, products])
  
  // 화살표 클릭 - 1개씩 스크롤
  const scrollLeftOne = () => {
    if (scrollRef.current) {
      const cardWidth = 300 + 24 // 카드 너비 + gap
      scrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' })
    }
  }
  
  const scrollRightOne = () => {
    if (scrollRef.current) {
      const cardWidth = 300 + 24 // 카드 너비 + gap
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
    }
  }
  
  const toggleWishlist = (e: React.MouseEvent | null, product: any) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const exists = wishlist.some(item => item.id === product.id)
    let newWishlist: any[]
    
    if (exists) {
      newWishlist = wishlist.filter(item => item.id !== product.id)
    } else {
      newWishlist = [...wishlist, product]
    }
    
    setWishlist(newWishlist)
    saveToStorage('wishlist', newWishlist)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('wishlistUpdated'))
    }
  }
  
  if (!mounted) {
    return (
      <section className={`relative ${bgColor} py-12`}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }
  
  // PC 버전 - 네이티브 스크롤 + 화살표 버튼
  if (isDesktop) {
    return (
      <section className={`relative ${bgColor} py-20 lg:py-24 overflow-hidden`}>
        <div className="max-w-[1400px] mx-auto px-8">
          {/* 섹션 헤더 */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <span className="text-sm font-medium text-rose-500 uppercase tracking-wider">Premium Collection</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-light text-neutral-900 mb-2 tracking-tight">
                {title}
              </h2>
              <p className="text-lg text-neutral-600">
                {subtitle}
              </p>
            </div>
            
            {/* 액션 버튼 - 우측 상단 */}
            <div className="flex gap-3 mt-2">
              <Link href={`/category/${getCategoryPath(title)}`}>
                <button className="px-6 py-2.5 text-sm border border-neutral-900 text-neutral-900 hover:bg-neutral-100 transition-all duration-300 font-medium">
                  전체보기
                </button>
              </Link>
              <Link href={`/category/${getCategoryPath(title)}?sort=popular`}>
                <button className="px-6 py-2.5 text-sm border border-neutral-900 text-neutral-900 hover:bg-neutral-100 transition-all duration-300 font-medium">
                  베스트
                </button>
              </Link>
            </div>
          </div>
          
          {/* 횡스크롤 컨테이너 */}
          <div className="relative group">
            {/* 왼쪽 화살표 */}
            <button 
              onClick={scrollLeftOne}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
                canScrollLeft 
                  ? 'opacity-100 hover:bg-white hover:scale-110 cursor-pointer' 
                  : 'opacity-30 cursor-not-allowed'
              }`}
              style={{ left: '-28px' }}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-7 h-7 text-neutral-900" strokeWidth={1.5} />
            </button>
            
            {/* 오른쪽 화살표 */}
            <button 
              onClick={scrollRightOne}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
                canScrollRight 
                  ? 'opacity-100 hover:bg-white hover:scale-110 cursor-pointer' 
                  : 'opacity-30 cursor-not-allowed'
              }`}
              style={{ right: '-28px' }}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-7 h-7 text-neutral-900" strokeWidth={1.5} />
            </button>
            
            {/* 그라데이션 엣지 효과 */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white/80 via-white/20 to-transparent z-10 pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/80 via-white/20 to-transparent z-10 pointer-events-none" />
            )}
            
            {/* 상품 카드 스크롤 영역 - 네이티브 스크롤 사용 */}
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              } as React.CSSProperties}
            >
              {products && products.length > 0 ? products.map((product) => (
                <div 
                  key={product.id} 
                  className="flex-shrink-0 w-[300px] group/card"
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <Link href={`/order?id=${product.id}`}>
                    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                      {/* 이미지 영역 */}
                      <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                        <Image 
                          src={product.image} 
                          alt={product.name}
                          fill
                          sizes="300px"
                          className="object-cover transition-transform duration-700 group-hover/card:scale-110"
                          quality={90}
                        />
                        
                        {/* 오버레이 그라데이션 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                        
                        {/* 호버 시 나타나는 Quick View */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                          hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105">
                            <span className="text-sm font-medium text-neutral-900">빠른 구매</span>
                          </div>
                        </div>
                        
                        {/* 찜하기 버튼 */}
                        <div className="absolute top-4 right-4 z-10">
                          <button 
                            onClick={(e) => toggleWishlist(e, product)}
                            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg transform hover:scale-110"
                          >
                            <Heart 
                              className={`w-5 h-5 transition-all duration-300 ${
                                wishlist.some(item => item.id === product.id) 
                                  ? 'fill-rose-500 text-rose-500' 
                                  : 'text-neutral-600 hover:text-rose-500'
                              }`} 
                            />
                          </button>
                        </div>
                        
                        {/* 할인 뱃지 */}
                        {product.originalPrice && (
                          <div className="absolute top-4 left-4">
                            <div className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                              {Math.round((1 - product.price/product.originalPrice) * 100)}% OFF
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 상품 정보 */}
                      <div className="p-5">
                        <h3 className="text-lg font-medium text-neutral-900 mb-2 group-hover/card:text-rose-500 transition-colors duration-300">
                          {product.name}
                        </h3>
                        <p className="text-sm text-neutral-500 mb-4 line-clamp-2 leading-relaxed">
                          {product.description || '프리미엄 꽃 상품'}
                        </p>
                        
                        {/* 가격 정보 */}
                        <div className="flex items-center justify-between">
                          <div>
                            {product.originalPrice && (
                              <span className="text-sm text-neutral-400 line-through block">
                                {product.originalPrice.toLocaleString()}원
                              </span>
                            )}
                            <span className="text-xl font-bold text-neutral-900">
                              {product.price.toLocaleString()}
                              <span className="text-sm font-normal">원</span>
                            </span>
                          </div>
                          <ArrowRight className="w-5 h-5 text-neutral-400 group-hover/card:text-rose-500 transition-all duration-300 transform group-hover/card:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4 mx-auto">
                      <Sparkles className="w-10 h-10 text-neutral-400" />
                    </div>
                    <p className="text-lg text-neutral-500">상품을 준비 중입니다</p>
                    <p className="text-sm text-neutral-400 mt-2">곧 만나보실 수 있어요</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 스크롤 힌트 텍스트 */}
            {products.length > 4 && (
              <div className="text-center mt-4">
                <p className="text-xs text-neutral-400">
                  마우스 휠 또는 화살표를 클릭하여 더 많은 상품을 확인하세요
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* 섹션 구분선 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
      </section>
    )
  }

  // 태블릿 버전 (기존 유지)
  if (!isDesktop && mounted && window.innerWidth >= 768) {
    return (
      <section className={`relative ${bgColor} py-12`}>
        <div className="px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-light text-neutral-900 mb-2">{title}</h2>
            <p className="text-neutral-600">{subtitle}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {products && products.length > 0 ? products.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/order?id=${product.id}`}>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg bg-white border border-neutral-200 hover:shadow-lg transition-all duration-300">
                    <div className="aspect-[4/5] relative overflow-hidden">
                      <Image 
                        src={product.image} 
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        quality={85}
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-neutral-900 mb-1 group-hover:text-rose-500 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-neutral-500 mb-2 line-clamp-1">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-neutral-900">
                          {product.price.toLocaleString()}원
                        </span>
                        <button 
                          onClick={(e) => toggleWishlist(e, product)}
                          className="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center hover:border-rose-500 hover:bg-rose-50 transition-all duration-300"
                        >
                          <Heart 
                            className={`w-3.5 h-3.5 transition-colors ${
                              wishlist.some(item => item.id === product.id) ? 'fill-rose-500 text-rose-500' : 'text-neutral-500'
                            }`} 
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-2 text-center py-12">
                <p className="text-neutral-500">상품을 준비 중입니다</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-6">
            <Link href={`/category/${getCategoryPath(title)}`} className="flex-1">
              <button className="w-full px-4 py-2.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors text-sm font-medium">
                전체보기
              </button>
            </Link>
            <Link href={`/category/${getCategoryPath(title)}?sort=popular`} className="flex-1">
              <button className="w-full px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm font-medium">
                인기상품
              </button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // 모바일 버전 (기존 유지 - 절대 수정하지 않음)
  return (
    <section className="relative bg-white py-8">
      <div className="px-4">
        <div className="mb-6">
          <h2 className="text-xl font-medium text-neutral-900">{title}</h2>
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        </div>
        
        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {isLoading ? (
              Array(6).fill(0).map((_, idx) => (
                <div key={idx} className="flex-shrink-0 w-40">
                  <div className="bg-white border border-neutral-100 overflow-hidden animate-pulse">
                    <div className="aspect-[4/5] bg-neutral-200" />
                    <div className="p-4">
                      <div className="h-4 bg-neutral-200 rounded mb-2" />
                      <div className="h-3 bg-neutral-200 rounded mb-3 w-3/4" />
                      <div className="h-5 bg-neutral-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-40">
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    image={product.image}
                    description={product.description}
                    isWishlisted={wishlist.some(item => item.id === product.id)}
                    onWishlistToggle={() => toggleWishlist(null, product)}
                  />
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8">
                <p className="text-neutral-500">상품을 준비 중입니다</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Link href={`/category/${getCategoryPath(title)}`} className="flex-1">
            <button className="w-full px-3 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium">
              전체보기
            </button>
          </Link>
          <Link href={`/category/${getCategoryPath(title)}?sort=popular`} className="flex-1">
            <button className="w-full px-3 py-2 bg-neutral-900 text-white text-sm font-medium">
              인기상품
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}