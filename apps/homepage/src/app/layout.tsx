import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: '레인보우꽃집 | 전국 당일 꽃배송 - RAINBOW-F',
  description: '레인보우꽃집(무지개꽃집) - 축하화환, 근조화환, 개업화환, 결혼식화환, 꽃다발 전국 당일배송. 화원 직거래로 합리적인 가격',
  keywords: '레인보우꽃집, 무지개꽃집, 꽃배달, 화환, 근조화환, 축하화환, 개업화환, 결혼식화환, 장례식화환, 꽃다발, 꽃바구니, 당일배송, 레인보우에프, RAINBOW-F',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RAINBOW-F',
  },
  openGraph: {
    title: '레인보우꽃집 | 전국 당일 꽃배송',
    description: '무지개꽃집 - 축하화환, 근조화환, 개업화환, 꽃다발 전국 당일배송',
    url: 'https://rainbow-f.kr',
    siteName: '레인보우꽃집 RAINBOW-F',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '레인보우꽃집 | 전국 당일 꽃배송',
    description: '무지개꽃집 - 축하화환, 근조화환, 개업화환, 꽃다발 전국 당일배송',
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
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}

        {/* 네이버 서치어드바이저 소유권 확인 메타태그 */}
        <meta name="naver-site-verification" content="319f36ba36b19fb7a27fd570a50cd3349623ac23" />

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