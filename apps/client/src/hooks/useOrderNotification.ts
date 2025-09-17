'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/stores/useStore'
import toast from 'react-hot-toast'

export function useOrderNotification() {
  const { currentStore } = useStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Create audio element (only if sound file exists)
    // For now, comment out to avoid 404 errors
    // audioRef.current = new Audio('/sounds/notification.mp3')
    // audioRef.current.volume = 0.7

    if (!currentStore?.id) return

    // Subscribe to new orders for this store
    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `receiver_store_id=eq.${currentStore.id}`
        },
        async (payload) => {
          const newOrder = payload.new as any
          
          // Play notification sound (if available)
          // try {
          //   await audioRef.current?.play()
          // } catch (error) {
          //   console.log('Audio play failed:', error)
          // }

          // Show toast notification
          toast.success(
            `새 주문이 들어왔습니다!\n${newOrder.product_name} - ${newOrder.customer_name}`,
            {
              duration: 5000,
              position: 'top-right',
              style: {
                background: '#10B981',
                color: '#fff',
                fontWeight: 'bold'
              }
            }
          )

          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('🎉 새 주문이 들어왔습니다!', {
              body: `${newOrder.product_name} - ${newOrder.customer_name}`,
              icon: '/logo.png',
              badge: '/logo.png',
              // vibrate: [200, 100, 200], // Not supported in NotificationOptions type
              tag: 'new-order'
            })

            // Click to focus window
            notification.onclick = () => {
              window.focus()
              notification.close()
              // Navigate to orders page
              window.location.href = '/orders'
            }
          }
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      channel.unsubscribe()
    }
  }, [currentStore?.id, supabase])

  // Manual test function
  const testNotification = async () => {
    try {
      // await audioRef.current?.play()
      toast.success('알림 테스트!')
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('알림 테스트', {
          body: '알림이 정상적으로 작동합니다',
          icon: '/logo.png'
        })
      }
    } catch (error) {
      console.error('Test notification failed:', error)
    }
  }

  return { testNotification }
}
