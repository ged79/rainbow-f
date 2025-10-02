'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, User, ShoppingBag, LogOut } from 'lucide-react'
import { loadFromStorage } from '../lib/storage'

interface EmotionalNavbarProps {
  showCategories?: boolean
  fixed?: boolean
  darkMode?: boolean
}

export default function EmotionalNavbar({ showCategories = false, fixed = false, darkMode = false }: EmotionalNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    
    // Load cart count
    const loadCartCount = () => {
      const cart = loadFromStorage('flowerCart', [])
      setCartCount(cart.length)
    }
    loadCartCount()
    
    // Load wishlist count
    const loadWishlistCount = () => {
      const wishlist = loadFromStorage('wishlist', [])
      setWishlistCount(wishlist.length)
    }
    loadWishlistCount()
    
    // Load user session
    const loadUser = () => {
      const userSession = localStorage.getItem('flower-member')
      if (userSession) {
        try {
          setUser(JSON.parse(userSession))
        } catch (e) {
          console.error('Failed to parse user session:', e)
          localStorage.removeItem('flower-member')
        }
      } else {
        setUser(null)
      }
    }
    loadUser()
    
    window.addEventListener('cartUpdated', loadCartCount)
    window.addEventListener('wishlistUpdated', loadWishlistCount)
    window.addEventListener('storage', loadUser)
    
    return () => {
      window.removeEventListener('cartUpdated', loadCartCount)
      window.removeEventListener('wishlistUpdated', loadWishlistCount)
      window.removeEventListener('storage', loadUser)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('flower-member')
    setUser(null)
    setShowUserMenu(false)
    router.push('/')
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'))
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  // 메인 페이지인지 확인
  const isMainPage = pathname === '/'
  
  // 메인 페이지일 때는 스크롤 전까지 투명 배경
  const navBg = fixed || scrolled 
    ? 'bg-white/98 backdrop-blur-md shadow-nav' 
    : isMainPage 
      ? 'bg-transparent' 
      : 'bg-white/90 backdrop-blur-sm'
  
  // 메인 페이지에서 스크롤 전에는 흰색 텍스트
  const textColor = (isMainPage && !scrolled && !fixed) ? 'text-white' : 'text-gray-900'
  const iconColor = (isMainPage && !scrolled && !fixed) ? 'text-white' : 'text-gray-700'

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto">
        {/* Main Navigation */}
        <div className="px-4 md:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <h1 className={`text-3xl font-bold tracking-tight transition-colors`}>
                <span className={`${textColor}`}>RAINBOW-F</span>
              </h1>
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className={`
                    w-full px-4 py-2 pr-10 
                    ${
                      isMainPage && !scrolled && !fixed
                        ? 'bg-white/10 border-white/30 text-white placeholder:text-white/70'
                        : 'bg-gray-50 border-gray-200 placeholder:text-gray-400'
                    }
                    border text-sm 
                    focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500
                    transition-all duration-300
                  `}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Search className={`w-4 h-4 ${
                    isMainPage && !scrolled && !fixed ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-rose-500'
                  } transition-colors`} strokeWidth={1.5} />
                </button>
              </form>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Order Lookup Button */}
              <Link 
                href="/shopping-cart" 
                className={`hidden md:inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium border rounded-lg transition-all
                  ${
                    isMainPage && !scrolled && !fixed
                      ? 'border-white/50 text-white hover:bg-white/10'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                주문조회
              </Link>

              {/* Mobile Search */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`md:hidden p-2 rounded-full transition-all hover:bg-gray-100`}
              >
                <Search className={`w-5 h-5 ${iconColor} hover:text-rose-500 transition-colors`} strokeWidth={1.5} />
              </button>

              {/* User Menu */}
              <div className="relative" ref={dropdownRef}>
                {user ? (
                  <>
                    <button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowUserMenu(!showUserMenu)
                      }}
                      className={`p-2 rounded-full transition-all hover:bg-gray-100 flex items-center gap-2`}
                    >
                      <User className={`w-5 h-5 ${iconColor} hover:text-rose-500 transition-colors`} strokeWidth={1.5} />
                      <span className={`hidden md:inline text-sm ${textColor}`}>{user.name || '사용자'}</span>
                    </button>
                    
                    {showUserMenu && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[100]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.name || '사용자'}</p>
                          <p className="text-xs text-gray-500">{user.phone || ''}</p>
                        </div>
                        
                        <Link 
                          href="/my-page" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          마이페이지
                        </Link>
                        
                        <Link 
                          href="/my-referrals" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          추천인 관리
                        </Link>
                        
                        <hr className="my-1 border-gray-100" />
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleLogout()
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          로그아웃
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link 
                    href="/login" 
                    className={`p-2 rounded-full transition-all hover:bg-gray-100 flex items-center gap-1`}
                  >
                    <User className={`w-5 h-5 ${iconColor} hover:text-rose-500 transition-colors`} strokeWidth={1.5} />
                    <span className={`hidden md:inline text-sm ${textColor}`}>로그인</span>
                  </Link>
                )}
              </div>

              {/* Mobile Order Lookup */}
              <Link 
                href="/shopping-cart" 
                className={`md:hidden inline-flex items-center justify-center px-2 py-1 text-xs font-medium border rounded transition-all
                  ${
                    isMainPage && !scrolled && !fixed
                      ? 'border-white/50 text-white hover:bg-white/10'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                주문조회
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          {isSearchOpen && (
            <div className="md:hidden mt-3 animate-slide-down">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  className={`w-full px-4 py-2.5 bg-gray-50 border-gray-200 border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-300`}
                  autoFocus
                />
              </form>
            </div>
          )}
        </div>

        {/* Category Bar */}
        {showCategories && (
          <div className={`border-t border-gray-100 bg-white`}>
            <div className="px-4 md:px-6 lg:px-8">
              <div className="flex items-center justify-start gap-6 md:gap-8 overflow-x-auto scrollbar-hide py-3">
                {[
                  { href: '/category/opening', label: '개업·행사' },
                  { href: '/category/wedding', label: '결혼식' },
                  { href: '/category/funeral', label: '장례식' },
                  { href: '/category/celebration', label: '승진·기념일' }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={`
                      text-sm whitespace-nowrap pb-1
                      ${pathname === item.href 
                        ? 'text-rose-500 border-b-2 border-rose-500 font-medium' 
                        : 'text-gray-600 hover:text-rose-500'
                      }
                      transition-all duration-300
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
