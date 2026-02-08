'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const categories = [
  { id: 'business', name: '개업/승진', color: 'border-yellow-200', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop' },
  { id: 'wedding', name: '결혼/프로포즈', color: 'border-pink-200', image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=100&h=100&fit=crop' },
  { id: 'condolence', name: '애도/위로', color: 'border-gray-200', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=100&h=100&fit=crop' },
  { id: 'planterior', name: '플랜테리어', color: 'border-green-200', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=100&h=100&fit=crop' },
  { id: 'gift', name: '꽃선물', color: 'border-purple-200', image: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=100&h=100&fit=crop' }
]

export default function EmotionalHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative h-[70vh] overflow-hidden bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      {/* Background decoration */}
      <div className="absolute top-40 right-20 w-72 h-72 bg-pink-200 rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-40 left-20 w-96 h-96 bg-yellow-100 rounded-full blur-3xl opacity-30"></div>
      
      {/* Hero Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Text */}
          <div className="animate-fadeIn">
            <p className="text-sm text-pink-600 mb-3 font-medium">시간이 흘러 추억은 우정이 되었습니다</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight" style={{ fontFamily: 'Noto Serif KR, serif' }}>
              마음을 전하는<br/>
              <span className="text-pink-500">특별한 순간</span>
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              소중한 사람에게 전하고 싶은 그 마음,<br/>
              꽃으로 더 아름답게 전해드립니다.
            </p>
            <Link href="/flower-recommendation">
              <button className="bg-pink-500 text-white px-6 py-3 rounded-full hover:bg-pink-600 transition shadow-lg hover:shadow-xl">
                꽃 선물 고르기
              </button>
            </Link>
          </div>

          {/* Right Image Card */}
          <div className="hidden lg:block relative">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-auto transform hover:scale-105 transition-transform duration-300">
              <img 
                src="https://images.unsplash.com/photo-1522057384400-681b421cfebc?w=400&h=300&fit=crop" 
                alt="감성 꽃다발" 
                className="rounded-xl w-full"
              />
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500 italic">My Youth</p>
                <p className="font-medium text-gray-700">마이 유스</p>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full w-20 h-20 flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse">
              당일<br/>배송
            </div>
          </div>
        </div>
      </div>

      {/* Category Section at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-700">어떤 마음을 전하고 싶으신가요?</h3>
          </div>
          
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 justify-center min-w-max px-4">
              {categories.map((category) => (
                <Link key={category.id} href={`/category/${category.id}`}>
                  <div className="group text-center cursor-pointer flex-shrink-0 transition-all duration-300 hover:-translate-y-1">
                    <div className={`w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden border-2 ${category.color} shadow-md group-hover:shadow-lg transition-shadow`}>
                      <img 
                        src={category.image} 
                        alt={category.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-700 group-hover:text-pink-600 transition-colors">
                      {category.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}