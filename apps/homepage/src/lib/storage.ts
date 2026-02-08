export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch {
      console.error('localStorage setItem failed')
    }
  },
  
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      console.error('localStorage removeItem failed')
    }
  }
}

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  const stored = safeLocalStorage.getItem(key)
  if (!stored) return defaultValue
  
  try {
    return JSON.parse(stored)
  } catch {
    return defaultValue
  }
}

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    safeLocalStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to storage')
  }
}