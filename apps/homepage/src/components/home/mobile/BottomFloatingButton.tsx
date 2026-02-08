'use client'

import { useState, useEffect } from 'react'

export default function BottomFloatingButton() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleQuickOrder = () => {
    // Quick order logic - could open modal or navigate
    window.location.href = 'tel:1588-1234' // Example phone number
  }

  const handleKakaoChat = () => {
    // Open KakaoTalk chat
    window.open('http://pf.kakao.com/_xjxcxj', '_blank') // Example Kakao channel
  }

  return (
    <>
      {/* Floating Action Buttons - Mobile Only */}
      <div className={`fixed bottom-20 right-4 flex flex-col gap-3 z-40 transition-transform duration-300 md:hidden ${
        isVisible ? 'translate-y-0' : 'translate-y-[200%]'
      }`}>
        {/* Quick Call Button */}
        <button
          onClick={handleQuickOrder}
          className="bg-green-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Quick phone order"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
            />
          </svg>
        </button>

        {/* KakaoTalk Chat Button */}
        <button
          onClick={handleKakaoChat}
          className="bg-yellow-400 text-gray-900 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="KakaoTalk consultation"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.54 1.78 4.77 4.5 6.087V21l4.35-2.437c.366.03.753.037 1.15.037 5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
          </svg>
        </button>

        {/* Scroll to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-white border-2 border-gray-300 text-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>

      {/* Quick Action Bar - Sticky at bottom for important CTAs */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30 md:hidden transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="flex gap-2">
          <button className="flex-1 bg-pink-50 text-pink-600 py-3 rounded-lg font-medium text-sm">
            💝 당일배송 가능
          </button>
          <button 
            onClick={() => window.location.href = '/order'}
            className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-medium text-sm"
          >
            바로 주문하기
          </button>
        </div>
      </div>
    </>
  )
}
