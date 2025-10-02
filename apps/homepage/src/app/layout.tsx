import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'RAINBOW-F - 전국 당일 꽃배송',
  description: '축하화환, 근조화환, 꽃다발 전국 당일배송. 화원 직거래로 합리적인 가격',
  keywords: '꽃배달, 화환, 근조화환, 축하화환, 꽃다발, 꽃바구니, 당일배송, 레인보우에프',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RAINBOW-F',
  },
  openGraph: {
    title: 'RAINBOW-F - 꽃배달 플랫폼',
    description: '전국 당일 꽃배송 서비스',
    url: 'https://rainbow-f.co.kr',
    siteName: 'RAINBOW-F',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAINBOW-F',
    description: '전국 당일 꽃배송',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* PWA 메타 태그 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="꽃배달" />
        
        {/* PWA 아이콘 */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-16x16.png" />
        
        {/* 폰트 프리로드 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Kakao SDK */}
        <script src="https://developers.kakao.com/sdk/js/kakao.min.js" async></script>
      </head>
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-serif antialiased">
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js');
              });
            }
          `
        }} />
        <ErrorBoundary>
          {children}
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  )
}