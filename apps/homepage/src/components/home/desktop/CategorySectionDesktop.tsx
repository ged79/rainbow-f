'use client'

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

interface CategorySectionDesktopProps {
  title: string
  subtitle: string
  products: Product[]
  bgColor?: string
  categoryId: string
}

export default function CategorySectionDesktop({
  title,
  subtitle,
  products,
  bgColor = 'bg-white',
  categoryId
}: CategorySectionDesktopProps) {
  return (
    <section className={`${bgColor} py-20`}>
      <div className="max-w-7xl mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light text-gray-900 mb-3">{title}</h2>
          <p className="text-lg text-gray-600">{subtitle}</p>
          <div className="mt-4 w-24 h-0.5 bg-pink-500 mx-auto"></div>
        </div>

        {/* Products Grid - 4 columns for desktop */}
        <div className="grid grid-cols-4 gap-8 mb-8">
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              isDesktop={true}
            />
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <Link href={`/category/${categoryId}`}>
            <button className="inline-flex items-center gap-2 px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300 font-medium">
              {title} 전체보기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
