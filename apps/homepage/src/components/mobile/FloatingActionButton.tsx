'use client'

import { useState, useEffect } from 'react'
import { ArrowUp, MessageCircle, Clock, X } from 'lucide-react'

export default function FloatingActionButton() {
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Load recent products from localStorage
    const saved = localStorage.getItem('recentProducts')
    if (saved) {
      setRecentProducts(JSON.parse(saved).slice(0, 3))
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (navigator.vibrate) navigator.vibrate(10)
  }

  const toggleExpanded = () => {
    setExpanded(!expanded)
    if (navigator.vibrate) navigator.vibrate(10)
  }

  if (!mounted) return null

  return (
    <>
      {/* Expanded Menu Overlay */}
      {expanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* FAB Container */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        {/* Expanded Actions */}
        {expanded && (
          <div className="mb-3 space-y-2">
            {/* Recent Products */}
            {recentProducts.length > 0 && (
              <div className="bg-white rounded-lg shadow-xl p-3 w-48 animate-slideUp">
                <p className="text-xs font-medium text-neutral-600 mb-2">최근 본 상품</p>
                <div className="space-y-2">
                  {recentProducts.map((product, idx) => (
                    <a 
                      key={idx}
                      href={`/order?id=${product.id}`}
                      className="flex items-center gap-2 hover:bg-neutral-50 rounded p-1"
                    >
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-neutral-700 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {product.price?.toLocaleString()}원
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Contact */}
            <button
              onClick={() => window.location.href = '/flower-consultation'}
              className="w-48 bg-white rounded-lg shadow-xl p-3 flex items-center gap-3 animate-slideUp"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-neutral-700">빠른 상담</p>
                <p className="text-xs text-neutral-500">전문가 추천받기</p>
              </div>
            </button>

            {/* Scroll to Top */}
            {showScrollTop && (
              <button
                onClick={scrollToTop}
                className="w-48 bg-white rounded-lg shadow-xl p-3 flex items-center gap-3 animate-slideUp"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <ArrowUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-neutral-700">맨 위로</p>
                  <p className="text-xs text-neutral-500">페이지 상단 이동</p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={toggleExpanded}
          className={`
            w-14 h-14 rounded-full shadow-xl flex items-center justify-center
            transition-all duration-300 active:scale-95
            ${expanded 
              ? 'bg-neutral-800 rotate-45' 
              : 'bg-gradient-to-br from-rose-500 to-pink-500 hover:shadow-2xl'
            }
          `}
        >
          {expanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <div className="relative">
              <Clock className="w-6 h-6 text-white" />
              {recentProducts.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          )}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </>
  )
}