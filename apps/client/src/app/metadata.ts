import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '꽃배달 플랫폼',
  description: '화원 간 꽃배달 주문 관리 시스템',
  applicationName: '꽃배달',
  authors: [{ name: 'Flower Delivery Platform' }],
  generator: 'Next.js',
  keywords: ['꽃배달', '화원', '꽃집', '배송', '주문관리'],
  themeColor: '#ec4899',
  colorScheme: 'light',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: '꽃배달',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
  },
  openGraph: {
    title: '꽃배달 플랫폼',
    description: '화원 간 꽃배달 주문 관리 시스템',
    type: 'website',
    locale: 'ko_KR',
    siteName: '꽃배달',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ec4899',
}