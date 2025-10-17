'use client'

import { useRef } from 'react'
import ProductCard from '../shared/ProductCard'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  image: string
  category: string
  description?: string
}

interface CategorySectionMobileProps {
  title: string
  subtitle: string
  products: Product[]
  bgColor?: string
  categoryId: string
}

export default function CategorySectionMobile({
  title,
  subtitle,
  products,
  bgColor = 'bg-white',
  categoryId
}: CategorySectionMobileProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  return (
    <section className={`${bgColor} py-6`}>
      <div className="px-4">
        {/* Section Header - Mobile Optimized */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>
          <Link href={`/category/${categoryId}`}>
            <button className="text-sm text-pink-600 font-medium flex items-center gap-1">
              더보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          {/* Scroll Buttons - Hidden on very small screens */}
          <button 
            onClick={scrollLeft}
            className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={scrollRight}
            className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Products Carousel */}
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {products.map((product) => (
              <div key={product.id} className="flex-none w-[160px] snap-start">
                <ProductCard
                  {...product}
                  isMobile={true}
                />
              </div>
            ))}
            
            {/* View More Card at the end */}
            <Link href={`/category/${categoryId}`}>
              <div className="flex-none w-[160px] snap-start">
                <div className="h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 min-h-[200px]">
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">더 많은 상품</span>
                  <span className="text-xs text-gray-500 mt-1">보러가기</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator Dots - Mobile only */}
        <div className="flex justify-center gap-1 mt-3 sm:hidden">
          {Array.from({ length: Math.min(5, Math.ceil(products.length / 2)) }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
          ))}
        </div>
      </div>
    </section>
  )
}
