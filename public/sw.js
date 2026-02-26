// Service Worker for Push Notifications + PWA Offline Caching
const CACHE_NAME = 'hookah-torus-v14'

// Critical routes — SW install MUST succeed for these
const CRITICAL_URLS = [
  '/',
  '/dashboard',
  '/mix',
  '/offline',
  '/inventory',
  '/sessions',
  '/kds',
  '/settings',
]

// Non-critical routes — precache attempt, but OK to fail individually
const NON_CRITICAL_URLS = [
  '/bowls',
  '/statistics',
  '/bar/inventory',
  '/bar/recipes',
  '/bar/sales',
  '/bar/menu',
  '/floor',
  '/floor/reservations',
  '/guests',
  '/shifts',
  '/waiter',
  '/reports',
  '/reviews',
  '/promotions',
  '/marketplace',
]

// Install event — precache app shell (critical fail-hard, non-critical fail-soft)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing', CACHE_NAME)
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Critical routes MUST succeed — reject install if they fail
      await cache.addAll(CRITICAL_URLS)
      console.log('[SW] Critical routes cached:', CRITICAL_URLS.length)

      // Non-critical routes — best-effort, each individually
      const results = await Promise.allSettled(
        NON_CRITICAL_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Non-critical precache skipped:', url, err.message)
          })
        )
      )
      const cached = results.filter((r) => r.status === 'fulfilled').length
      console.log(`[SW] Non-critical routes cached: ${cached}/${NON_CRITICAL_URLS.length}`)
    })
    // No outer .catch() — if critical routes fail, install rejects and old SW stays active
  )
  // Do NOT call self.skipWaiting() here — controlled via SKIP_WAITING message
})

// Activate event — clean up old caches + verify critical routes
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating', CACHE_NAME)
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      // Delete old caches
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )

      // Health check: verify critical routes are cached
      const cache = await caches.open(CACHE_NAME)
      for (const url of CRITICAL_URLS) {
        const cached = await cache.match(url)
        if (!cached) {
          console.warn('[SW] Health check: re-caching missing critical route:', url)
          try {
            await cache.add(url)
          } catch (err) {
            console.error('[SW] Health check failed for', url, err)
          }
        }
      }

      return clients.claim()
    })
  )
})

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Fetch event — network-first for pages, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip external requests
  if (url.origin !== self.location.origin) return

  // Skip API routes
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|webp|mp4|ico)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Network-first for pages
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Fallback to offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline')
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received')

  let data = {
    title: 'Hookah Torus',
    body: 'New notification',
    icon: '/images/icon-192.png',
    badge: '/images/badge-72.png',
    tag: 'default',
    data: { url: '/dashboard' }
  }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon-192.png',
    badge: data.badge || '/images/badge-72.png',
    tag: data.tag || 'default',
    vibrate: [200, 100, 200],
    data: data.data || { url: '/dashboard' },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed')
})

// Background Sync — triggered by OS when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    console.log('[SW] Background sync triggered: sync-mutations')
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          if (windowClients.length > 0) {
            windowClients[0].postMessage({ type: 'TRIGGER_SYNC' })
          }
        })
    )
  }
})
