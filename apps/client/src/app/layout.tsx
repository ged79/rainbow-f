import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from '@/components/errors/ErrorBoundary'
import Providers from '@/components/Providers'
import { metadata as appMetadata, viewport as appViewport } from './metadata'

// Environment validation
const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]
requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Missing required environment variable: ${env}`)
  }
})

const inter = Inter({ subsets: ['latin'] })

export const metadata = appMetadata
export const viewport = appViewport

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  )
}
