'use client'

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { Store } from '@flower/shared/types'
import React from 'react'

// Define the state interface
interface AppState {
  // Session
  session: {
    user: {
      id: string
      email: string
      store_id?: string
    }
    store?: Store
  } | null
  currentStore: Store | null
  
  // UI State
  isSidebarOpen: boolean
  isLoading: boolean
  
  // Actions
  setSession: (session: AppState['session']) => void
  setCurrentStore: (store: Store | null) => void
  setSidebarOpen: (open: boolean) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

// Create the store
const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        session: null,
        currentStore: null,
        isSidebarOpen: false,
        isLoading: false,
        
        // Actions
        setSession: (session) => set({ session }),
        setCurrentStore: (store) => set({ currentStore: store }),
        setSidebarOpen: (open) => set({ isSidebarOpen: open }),
        setLoading: (loading) => set({ isLoading: loading }),
        clearSession: () => set({ 
          session: null, 
          currentStore: null 
        }),
      }),
      {
        name: 'flower-app-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          session: state.session,
          currentStore: state.currentStore,
        }),
      }
    ),
    {
      name: 'flower-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// Export hooks
export { useAppStore }

// Simplified hook that directly returns the store
export const useStore = () => useAppStore()

// StoreProvider component - 실제로는 필요없지만 호환성을 위해 추가
export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Zustand는 전역 상태이므로 Provider가 실제로는 필요없음
  // 하지만 기존 코드 호환성을 위해 children만 반환
  return <>{children}</>
}