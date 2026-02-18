'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Check for updates periodically (every 60s)
      const interval = setInterval(() => registration.update(), 60_000)

      // Listen for new SW waiting
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available — show toast
            toast('Доступно обновление', {
              description: 'Нажмите чтобы обновить приложение',
              action: {
                label: 'Обновить',
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

      return () => clearInterval(interval)
    }).catch((err) => {
      console.error('SW registration failed:', err)
    })

    // Detect controller change (new SW activated) — reload
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  return null
}
