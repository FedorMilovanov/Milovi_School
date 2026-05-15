/**
 * Service Worker — Patisserie Russe
 *
 * Cache strategy:
 *   • install → precache shell assets (offline-first launch)
 *   • activate → drop every cache whose key doesn't end with the
 *     current build hash; then claim all open clients
 *   • fetch (navigations) → network-first, fall back to cache, then to '/'
 *   • fetch (everything else, same-origin) → cache-first, lazy refresh
 *
 * Build hash:
 *   __BUILD_HASH__ is replaced at the end of `astro build` by the
 *   integration in astro.config.mjs (bumpServiceWorkerVersion). In dev
 *   the placeholder is left as-is — the registration script in
 *   BaseLayout.astro skips registration on localhost so the unresolved
 *   string never reaches a real cache.
 */

const CACHE_VERSION  = '__BUILD_HASH__'
const PRECACHE_NAME  = `patisserie-precache-${CACHE_VERSION}`
const RUNTIME_NAME   = `patisserie-runtime-${CACHE_VERSION}`
const RUNTIME_MAX    = 60

const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/images/placeholder.svg',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Trim a runtime cache to N most-recent entries (FIFO eviction). */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= maxItems) return
  const overflow = keys.length - maxItems
  for (let i = 0; i < overflow; i++) await cache.delete(keys[i])
}

/** Cache the response, then trim — guarantees the put completes first. */
async function cacheAndTrim(request, response) {
  const cache = await caches.open(RUNTIME_NAME)
  await cache.put(request, response)
  await trimCache(RUNTIME_NAME, RUNTIME_MAX)
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('patisserie-') && !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML navigations — network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            event.waitUntil(cacheAndTrim(request, response.clone()))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          return cached ?? caches.match('/') ?? new Response('Offline', { status: 503 })
        })
    )
    return
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          event.waitUntil(cacheAndTrim(request, response.clone()))
        }
        return response
      }).catch(async () => {
        if (request.destination === 'image') {
          return (await caches.match('/images/placeholder.svg')) ||
            new Response('', { status: 503, statusText: 'Offline' })
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})
