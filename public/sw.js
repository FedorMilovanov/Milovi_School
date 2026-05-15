function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems))
      }
    })
  })
}
/**
 * Service Worker — Patisserie Russe (Improved)
 */
const CACHE_VERSION = '__BUILD_HASH__'
const PRECACHE_NAME = `patisserie-precache-${CACHE_VERSION}`
const RUNTIME_NAME = `patisserie-runtime-${CACHE_VERSION}`

const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/images/og-preview.webp',
  '/images/placeholder.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // FIX H-5: Never trim precache. Runtime cache is trimmed.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(RUNTIME_NAME).then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => caches.match(request).then((c) => c ?? caches.match('/')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          caches.open(RUNTIME_NAME).then((c) => c.put(request, response.clone()))
        }
        return response
      }).catch(async () => {
        if (request.destination === 'image') {
          return (await caches.match('/images/placeholder.svg')) || new Response('Offline')
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})
