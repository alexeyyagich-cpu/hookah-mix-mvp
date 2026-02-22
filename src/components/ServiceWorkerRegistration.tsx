'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n'

export function ServiceWorkerRegistration() {
  const tc = useTranslation('common')
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates periodically (every 60s)
      intervalRef.current = setInterval(() => registration.update(), 60_000)

      // Listen for new SW waiting
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — show toast
            toast(tc.sw.updateAvailable, {
              description: tc.sw.updateDescription,
              action: {
                label: tc.sw.update,
                onClick: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                },
              },
              duration: Infinity,
            })
          }
        })
      })
    }).catch((err) => {
      console.error('SW registration failed:', err)
    })

    // Detect controller change (new SW activated) — reload
    let refreshing = false
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      clearInterval(intervalRef.current)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [tc])

  return null
}
