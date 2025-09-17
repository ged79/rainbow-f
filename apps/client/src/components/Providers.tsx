'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoreProvider } from '@/stores/useStore'
import { useState } from 'react'

export default function Providers({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Create QueryClient only once
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 2, // Retry failed requests twice
          },
          mutations: {
            retry: 1, // Retry failed mutations once
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        {children}
      </StoreProvider>
    </QueryClientProvider>
  )
}
