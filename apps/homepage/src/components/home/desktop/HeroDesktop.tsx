'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Coins } from 'lucide-react'

const heroSlides = [
  { 
    image: '/코스모스.jpg', 
    title: '전국 3시간 당일배송'
  },
  { 
    image: '/프리미엄 꽃다발.jpg', 
    title: '구매금액 최대 5% 포인트 적립'
  },
  { 
    image: '/믹스부케.jpg', 
    title: '추천인도 3% 포인트 적립'
  }
]

export default function HeroDesktop() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative w-full h-[75vh]">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90"></div>
        
        <div className="absolute inset-0 flex flex-col justify-end items-start text-left px-16 pb-32">
          <h1 className="text-6xl font-light text-white mb-4 tracking-tight drop-shadow-lg">
            {currentSlide === 1 || currentSlide === 2 ? (
              <Link href="/points-guide" className="underline underline-offset-4 decoration-2 hover:decoration-4">
                {heroSlides[currentSlide].title}
              </Link>
            ) : (
              heroSlides[currentSlide].title
            )}
          </h1>
        </div>

        <div className="absolute bottom-10 left-16 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 포인트 혜택 플로팅 버튼 - 오른쪽 하단 */}
      <Link 
        href="/points-guide" 
        className="fixed bottom-10 right-10 z-50 bg-rose-500 hover:bg-rose-600 transition-all duration-300 rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:shadow-2xl group"
      >
        <span className="text-white text-2xl font-bold">P</span>
      </Link>
    </section>
  )
}