'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/stores/useStore'
import { useOrderNotification } from '@/hooks/useOrderNotification'
import {
  Home,
  Package,
  CreditCard,
  Calculator,
  Settings,
  LogOut,
  Menu,
  X,
  Truck,
  ShoppingBag,
  Power,
  ChevronDown,
  Megaphone
} from 'lucide-react'
import { formatCurrency } from '@flower/shared/utils'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/services/logger'

const menuItems = [
  { icon: Home, label: '대시보드', href: '/dashboard' },
  { icon: Package, label: '주문 관리', href: '/orders' },
  { icon: CreditCard, label: '포인트', href: '/points' },
  { icon: Calculator, label: '정산', href: '/settlements' },
  { icon: Settings, label: '설정', href: '/settings' }
]

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const store = useStore()
  const currentStore = store.currentStore
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Enable order notifications
  useOrderNotification()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Store가 없으면 로드
          if (!currentStore) {
            const { data: storeData } = await supabase
              .from('stores')
              .select('*')
              .eq('user_id', session.user.id)
              .single()
            
            if (storeData) {
              store.setCurrentStore(storeData)
              store.setSession({
                user: {
                  id: session.user.id,
                  email: session.user.email!,
                  store_id: storeData.id
                },
                store: storeData
              })
            }
          }
        } else {
          logger.warn('No session found, redirecting to login')
          router.push('/login')
        }
      } catch (error) {
        logger.error('Session check error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkSession()
    
    // Auth state 변경 구독
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        logger.info('User signed out')
        store.clearSession()
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        logger.info('User signed in', { userId: session.user.id })
      }
    })
    
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      logger.info('Logout initiated')
      const supabase = createClient()
      await supabase.auth.signOut()
      store.clearSession()
      router.push('/login')
    } catch (error) {
      logger.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-xl font-bold text-pink-500 hover:text-pink-600 transition cursor-pointer"
                >
                  🌸 레인보우꽃배달
                </button>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname.startsWith(item.href)
                  
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                        isActive
                          ? 'bg-pink-50 text-pink-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Right side items */}
            <div className="flex items-center gap-4">
              {/* Points Display */}
              {currentStore && (
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-600">포인트:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(currentStore.points_balance || 0)}
                  </span>
                </div>
              )}

              {/* 주문 관리 빠른 링크 */}
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => router.push('/orders/new')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    pathname === '/orders/new' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ShoppingBag className="inline w-4 h-4 mr-1" />
                  발주
                </button>
                <button
                  onClick={() => router.push('/orders')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    pathname === '/orders' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="inline w-4 h-4 mr-1" />
                  발송
                </button>
                <button
                  onClick={() => router.push('/orders/received')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                    pathname === '/orders/received' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Truck className="inline w-4 h-4 mr-1" />
                  수주
                </button>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-semibold">
                      {currentStore?.business_name?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {currentStore?.business_name || 'Loading...'}
                  </span>
                  <ChevronDown size={16} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-semibold text-gray-900">
                        {currentStore?.business_name}
                      </p>
                      <p className="text-xs text-gray-500">{currentStore?.email}</p>
                    </div>
                    <button
                      onClick={() => router.push('/settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      설정
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.href)
                
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition ${
                      isActive
                        ? 'bg-pink-50 text-pink-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-lg flex items-center gap-3 text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={20} />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}