// Service Worker for Push Notifications + PWA Offline Caching
const CACHE_NAME = 'hookah-torus-v2'

// App shell URLs to precache
const APP_SHELL_URLS = [
  '/dashboard',
  '/mix',
  '/inventory',
  '/offline',
]

// Install event — precache app shell
self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS)
    }).catch((err) => {
      console.log('Precache failed (non-critical):', err)
    })
  )
  self.skipWaiting()
})

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => clients.claim())
  )
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
  console.log('Push received:', event)

  let data = {
    title: 'Hookah Torus',
    body: 'Новое уведомление',
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
  console.log('Notification clicked:', event)
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen)
            return client.focus()
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
})
