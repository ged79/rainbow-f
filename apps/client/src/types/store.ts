/**
 * Store Types - Enhanced store management
 */

import type { Store } from '@flower/shared/types'

// Fix for Zustand store persistence
export interface AppState {
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

// Zustand persist configuration type
export interface PersistConfig {
  name: string
  version?: number
  partialize?: (state: AppState) => Partial<AppState>
}
