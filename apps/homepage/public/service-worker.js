// Service Worker for PWA - 오프라인 지원 및 캐싱
const CACHE_NAME = 'flower-delivery-v1';
const OFFLINE_URL = '/offline.html';

// 캐시할 정적 자원들
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// 설치 이벤트 - 정적 자원 캐싱
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백 전략
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // API 요청은 항상 네트워크로
  if (request.url.includes('/api/') || request.url.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(JSON.stringify({
            error: '네트워크 연결을 확인해주세요'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // HTML 페이지 - 네트워크 우선, 오프라인 페이지 폴백
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  
  // 정적 자원 - 캐시 우선, 네트워크 폴백
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          // 이미지는 캐시에 저장
          if (request.url.includes('.png') || 
              request.url.includes('.jpg') || 
              request.url.includes('.jpeg') || 
              request.url.includes('.webp')) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        });
      })
      .catch(() => {
        // 이미지 실패시 플레이스홀더
        if (request.url.includes('.png') || 
            request.url.includes('.jpg') || 
            request.url.includes('.jpeg')) {
          return caches.match('/placeholder.jpg');
        }
      })
  );
});

// 백그라운드 동기화 - 오프라인 주문 처리
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('[SW] Syncing offline orders');
    event.waitUntil(syncOfflineOrders());
  }
});

// 푸시 알림
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || '꽃배달 알림';
  const options = {
    body: data.body || '새로운 소식이 있습니다',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림 클릭
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

// 오프라인 주문 동기화 함수
async function syncOfflineOrders() {
  // IndexedDB에서 오프라인 주문 가져오기
  const offlineOrders = await getOfflineOrders();
  
  for (const order of offlineOrders) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      
      if (response.ok) {
        await removeOfflineOrder(order.id);
        console.log('[SW] Synced order:', order.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync order:', order.id);
    }
  }
}

// IndexedDB 헬퍼 함수들
async function getOfflineOrders() {
  // 구현 필요
  return [];
}

async function removeOfflineOrder(id) {
  // 구현 필요
}