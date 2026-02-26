'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n'

export function ServiceWorkerRegistration() {
  const tc = useTranslation('common')
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let mounted = true
    let registration: ServiceWorkerRegistration | null = null
    let updateFoundHandler: (() => void) | null = null
    let stateChangeHandler: (() => void) | null = null
    let trackedWorker: ServiceWorker | null = null

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (!mounted) return
      registration = reg

      // Check for updates periodically (every 60s)
      intervalRef.current = setInterval(() => reg.update(), 60_000)

      // Listen for new SW waiting
      updateFoundHandler = () => {
        const newWorker = reg.installing
        if (!newWorker) return

        // Clean up previous statechange listener if any
        if (trackedWorker && stateChangeHandler) {
          trackedWorker.removeEventListener('statechange', stateChangeHandler)
        }
        trackedWorker = newWorker

        stateChangeHandler = () => {
          if (!mounted) return
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
        }
        newWorker.addEventListener('statechange', stateChangeHandler)
      }
      reg.addEventListener('updatefound', updateFoundHandler)
    }).catch((err) => {
      console.error('SW registration failed:', err)
    })

    // Detect controller change (new SW activated) — reload
    let refreshing = false
    const handleControllerChange = () => {
      if (!refreshing && mounted) {
        refreshing = true
        window.location.reload()
      }
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      mounted = false
      clearInterval(intervalRef.current)
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      if (registration && updateFoundHandler) {
        registration.removeEventListener('updatefound', updateFoundHandler)
      }
      if (trackedWorker && stateChangeHandler) {
        trackedWorker.removeEventListener('statechange', stateChangeHandler)
      }
    }
  }, [tc])

  return null
}
