/**
 * Service Worker — Patisserie Russe
 *
 * Strategy:
 *  - Navigation (HTML pages): network-first → cache fallback
 *  - Static assets (JS, CSS, local images): cache-first → network fallback
 *  - Cross-origin (Unsplash, etc.): pass-through, no caching
 *
 * UpdateNotification.tsx handles SKIP_WAITING prompt.
 * New SW waits in `installed` state until user confirms update.
 */

const CACHE_VERSION = 'v1'
const CACHE_NAME = `patisserie-russe-${CACHE_VERSION}`

const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/images/og-preview.webp',
]

// ─── Install ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      // Do NOT call skipWaiting() here.
      // UpdateNotification shows the prompt; user triggers SKIP_WAITING.
  )
})

// ─── Activate ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

// ─── Message ─────────────────────────────────────────────────────────────────
// UpdateNotification.tsx posts { type: 'SKIP_WAITING' } when the user taps "Обновить"
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Don't cache cross-origin requests (Unsplash CDN, etc.)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Navigation — network-first so pages stay fresh
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match('/'))
        )
    )
    return
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          caches.open(CACHE_NAME).then((c) => c.put(request, response.clone()))
        }
        return response
      })
    })
  )
})
