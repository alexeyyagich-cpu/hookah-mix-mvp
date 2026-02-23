'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

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
  const { user } = useAuth()
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
        'Notification' in window &&
        VAPID_PUBLIC_KEY.length > 0

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

      // Subscribe to push with VAPID key
      let subscription: PushSubscription | null = null
      if (VAPID_PUBLIC_KEY) {
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
        } catch (e) {
          // If VAPID fails, we'll use local notifications only
        }
      }

      // Send subscription to server
      if (subscription && user) {
        try {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: subscription.toJSON(),
              profileId: user.id,
            }),
          })
        } catch {
          // Non-critical: subscription saved locally
        }
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
  }, [state.isSupported, user])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove from server
        if (user) {
          try {
            await fetch('/api/push/subscribe', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
                profileId: user.id,
              }),
            })
          } catch {
            // Non-critical
          }
        }
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
  }, [user])

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
