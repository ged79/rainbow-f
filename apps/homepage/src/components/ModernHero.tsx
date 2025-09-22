'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles, Heart, Flower, Gift, Coins } from 'lucide-react'
import Button from '../components/ui/Button'

const categories = [
  { 
    id: 'wedding', 
    name: '결혼식', 
    icon: Heart,
    image: '/백장미.jpg',
    description: '영원한 사랑을 약속합니다',
    bgColor: 'from-pink-50 to-rose-50',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-700',
    hoverBg: 'hover:from-pink-100 hover:to-rose-100'
  },
  { 
    id: 'funeral', 
    name: '장례식', 
    icon: Flower,
    image: '/근조_기본.png',
    description: '깊은 애도를 전합니다',
    bgColor: 'from-gray-100 to-slate-100',
    iconBg: 'bg-gray-200',
    iconColor: 'text-gray-700',
    hoverBg: 'hover:from-gray-200 hover:to-slate-200'
  },
  { 
    id: 'opening', 
    name: '개업·행사', 
    icon: Sparkles,
    image: '/꽃상자.jpg',
    description: '새로운 시작을 축하합니다',
    bgColor: 'from-emerald-50 to-teal-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    hoverBg: 'hover:from-emerald-100 hover:to-teal-100'
  },
  { 
    id: 'celebration', 
    name: '승진·기념일', 
    icon: Gift,
    image: '/호접란.jpg',
    description: '특별한 날을 기념합니다',
    bgColor: 'from-purple-50 to-violet-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    hoverBg: 'hover:from-purple-100 hover:to-violet-100'
  }
]

const heroSlides = [
  { 
    image: '/믹스부케.jpg', 
    title: '전국 3시간 당일배송',
    subtitle: '',
    description: ''
  },
  { 
    image: '/코스모스.jpg', 
    title: '구매금액 최대 5% 포인트 적립',
    subtitle: '',
    description: ''
  },
  { 
    image: '/프리미엄 꽃다발.jpg', 
    title: '추천인도 3% 포인트 적립',
    subtitle: '',
    description: ''
  }
]

export default function ModernHero() {
  const [mounted, setMounted] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    setMounted(true)
    setIsDesktop(window.innerWidth >= 1024)
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 11000)
    return () => clearInterval(timer)
  }, [isPaused])

  // 초기 로딩 시 데이지 이미지 표시
  if (!mounted) {
    return (
      <section className="relative overflow-hidden bg-white">
        <div className="relative w-full h-[76.5vh] min-h-[500px]">
          <Image 
            src="/데이지.jpg"
            alt="Loading"
            fill
            sizes="100vw"
            className="object-cover opacity-80"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-pulse">
              <h2 className="text-3xl font-light text-white mb-2">BLOOM</h2>
              <p className="text-white/80">로딩 중...</p>
            </div>
          </div>

          {/* 포인트 혜택 버튼 - PC 오른쪽 하단 */}
          <Link 
            href="/points-guide" 
            className="fixed bottom-10 right-10 z-50 bg-rose-500 hover:bg-rose-600 transition-all duration-300 rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:shadow-2xl group"
          >
            <span className="text-white text-2xl font-bold">P</span>
          </Link>
        </div>
      </section>
    )
  }

  // PC 버전
  if (isDesktop) {
    return (
      <section className="relative overflow-hidden bg-white">
        <div 
          className="relative w-full h-[70vh] min-h-[500px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1500 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            >
              <Image 
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority={index === 0}
                quality={90}
              />
              {index === 0 && (
                <div className="absolute inset-0 bg-black/20"></div>
              )}
            </div>
          ))}
          
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-8 w-full">
              <div className="max-w-2xl">
                <h1 className="text-4xl lg:text-5xl text-white mb-4 tracking-tight">
                {currentSlide === 1 ? (
                  <Link href="/points-guide" className="hover:underline underline-offset-4 decoration-2">
                    <span className="font-light leading-tight underline">{heroSlides[currentSlide].title}</span>
                  </Link>
                ) : currentSlide === 2 ? (
                  <Link href="/points-guide" className="hover:underline underline-offset-4 decoration-2">
                    <span className="font-light leading-tight underline">{heroSlides[currentSlide].title}</span>
                  </Link>
                ) : (
                  <span className="font-light leading-tight">{heroSlides[currentSlide].title}</span>
                )}
                {heroSlides[currentSlide].subtitle && (
                  <><br/><span className="font-bold">{heroSlides[currentSlide].subtitle}</span></>
                )}
              </h1>
              {heroSlides[currentSlide].description && (
                <p className="text-lg text-white/90 mb-8 font-light">
                  {heroSlides[currentSlide].description}
                </p>
              )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'bg-white w-12' 
                    : 'bg-white/40 w-8 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative -mt-32 z-10 pb-20">
          <div className="max-w-7xl mx-auto px-8">
            <h3 className="text-center text-2xl font-light text-white mb-6 drop-shadow-lg">
              어떤 마음을 전하고 싶으신가요?
            </h3>
            
            <div className="grid grid-cols-4 gap-6">
              {categories.map((category, index) => {
                const IconComponent = category.icon
                return (
                  <Link key={category.id} href={`/category/${category.id}`}>
                    <div 
                      className="group cursor-pointer transform hover:-translate-y-2 transition-all duration-500"
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden transform hover:-translate-y-1">
                        <div className={`h-32 bg-gradient-to-br ${category.bgColor} ${category.hoverBg} transition-all duration-300 flex items-center justify-center relative overflow-hidden`}>
                          <IconComponent className={`w-12 h-12 ${category.iconColor} transition-transform duration-300 group-hover:scale-110`} strokeWidth={1} />
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-rose-500 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* 포인트 혜택 버튼 - 모바일 오른쪽 하단 */}
        <Link 
          href="/points-guide" 
          className="fixed bottom-6 right-6 z-50 bg-rose-500 hover:bg-rose-600 transition-all duration-300 rounded-full w-14 h-14 flex items-center justify-center shadow-xl"
        >
          <span className="text-white text-xl font-bold">P</span>
        </Link>
      </section>
    )
  }

  // 모바일 버전
  return (
    <section className="relative overflow-hidden bg-white">
      {/* 히어로 이미지 - 확대 */}
      <div className="relative w-full h-[76.5vh] min-h-[500px]">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img 
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* 믹스부케 이미지만 살짝 오버레이 */}
            {slide.image.includes('믹스부케') && (
              <div className="absolute inset-0 bg-black/10"></div>
            )}
          </div>
        ))}
        
        <div className="absolute bottom-8 left-6">
          <div className="max-w-[85%]">
            {/* 텍스트 컨테이너 */}
            <div className="relative">
              <h1 className="text-xl text-white mb-2 font-medium drop-shadow-2xl">
                {currentSlide === 1 || currentSlide === 2 ? (
                  <Link href="/points-guide" className="underline underline-offset-2 decoration-1">
                    {heroSlides[currentSlide].title}
                  </Link>
                ) : (
                  heroSlides[currentSlide].title
                )}
                {heroSlides[currentSlide].subtitle && (
                  <><br/><span className="font-bold drop-shadow-2xl">{heroSlides[currentSlide].subtitle}</span></>
                )}
              </h1>
              {heroSlides[currentSlide].description && (
                <p className="text-white text-xs font-medium drop-shadow-xl">
                  {heroSlides[currentSlide].description}
                </p>
              )}
            </div>
          </div>

          {/* 포인트 혜택 버튼 - PC 오른쪽 하단 */}
          <Link 
            href="/points-guide" 
            className="fixed bottom-10 right-10 z-50 bg-rose-500 hover:bg-rose-600 transition-all duration-300 rounded-full w-16 h-16 flex items-center justify-center shadow-xl hover:shadow-2xl group"
          >
            <span className="text-white text-2xl font-bold">P</span>
          </Link>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/40 w-6'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 카테고리 섹션 - 한줄 배치 */}
      <div className="px-4 py-6 bg-white">
        <h3 className="text-center text-base font-medium text-neutral-900 mb-4">
          어떤 마음을 전하고 싶으신가요?
        </h3>
        
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const IconComponent = category.icon
            return (
              <Link key={category.id} href={`/category/${category.id}`} className="flex-shrink-0">
                <div className="bg-white border border-neutral-200 rounded-lg p-2 hover:border-rose-300 hover:shadow-md transition-all w-[80px]">
                  <div className={`w-9 h-9 rounded-full ${category.iconBg} flex items-center justify-center mx-auto mb-1`}>
                    <IconComponent className={`w-5 h-5 ${category.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <h4 className="font-medium text-xs text-neutral-900 text-center">
                    {category.name}
                  </h4>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
