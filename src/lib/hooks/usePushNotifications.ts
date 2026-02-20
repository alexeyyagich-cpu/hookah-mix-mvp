'use client'

import { useState, useEffect, useCallback } from 'react'

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  permission: NotificationPermission | 'default'
  loading: boolean
  error: string | null
}

interface UsePushNotificationsReturn extends PushNotificationState {
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  sendLocalNotification: (title: string, options?: NotificationOptions) => void
}

// Local storage key for subscription state
const PUSH_SUBSCRIBED_KEY = 'hookah-torus-push-subscribed'

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: true,
    error: null,
  })

  // Check support and current state on mount
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported =
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          loading: false,
        }))
        return
      }

      const permission = Notification.permission
      const wasSubscribed = localStorage.getItem(PUSH_SUBSCRIBED_KEY) === 'true'

      // Check actual subscription status
      let isSubscribed = false
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        isSubscribed = !!subscription
      } catch (e) {
        console.error('Error checking subscription:', e)
      }

      setState({
        isSupported: true,
        isSubscribed: isSubscribed || (wasSubscribed && permission === 'granted'),
        permission,
        loading: false,
        error: null,
      })
    }

    checkSupport()
  }, [])

  // SW registration is handled by ServiceWorkerRegistration component

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications are not supported' }))
      return false
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission,
          loading: false,
          error: 'Notification permission denied',
        }))
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push (using a placeholder VAPID key for local notifications)
      // In production, you'd use real VAPID keys from your push service
      try {
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // This is a placeholder - in production use real VAPID public key
          applicationServerKey: urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          ),
        })
      } catch (e) {
        // If VAPID fails, we'll use local notifications only
      }

      localStorage.setItem(PUSH_SUBSCRIBED_KEY, 'true')

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        permission: 'granted',
        loading: false,
      }))

      // Show confirmation notification
      sendLocalNotificationInternal('Notifications enabled', {
        body: 'You will receive low stock alerts',
        tag: 'subscription-confirmed',
      })

      return true
    } catch (error) {
      console.error('Subscription error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }))
      return false
    }
  }, [state.isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      localStorage.removeItem(PUSH_SUBSCRIBED_KEY)

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        loading: false,
      }))

      return true
    } catch (error) {
      console.error('Unsubscribe error:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unsubscribe failed',
      }))
      return false
    }
  }, [])

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    sendLocalNotificationInternal(title, options)
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  }
}

// Helper to send local notification
function sendLocalNotificationInternal(title: string, options?: NotificationOptions & { vibrate?: number[] }) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return

  const defaultOptions = {
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png',
    ...options,
  } as NotificationOptions

  // Try service worker notification first (works in background)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, defaultOptions)
    }).catch(() => {
      // Fallback to regular notification
      new Notification(title, defaultOptions)
    })
  } else {
    new Notification(title, defaultOptions)
  }
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}

// Export helper for triggering low stock notifications
export function triggerLowStockNotification(items: Array<{ brand: string; flavor: string; quantity: number }>) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return
  if (localStorage.getItem(PUSH_SUBSCRIBED_KEY) !== 'true') return

  const count = items.length
  const title = `Low stock: ${count} ${count === 1 ? 'item' : 'items'}`
  const body = items.slice(0, 3).map(i => `${i.brand} ${i.flavor}: ${i.quantity}g`).join('\n')
    + (count > 3 ? `\n...and ${count - 3} more` : '')

  sendLocalNotificationInternal(title, {
    body,
    tag: 'low-stock',
    data: { url: '/inventory' },
    requireInteraction: true,
  })
}
