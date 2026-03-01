const SHELL_CACHE = 'kash-shell-v2'
const STATIC_CACHE = 'kash-static-v2'
const MAX_STATIC_ENTRIES = 80

const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS)
    }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== SHELL_CACHE && cacheName !== STATIC_CACHE)
          .map((cacheName) => caches.delete(cacheName)),
      )

      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const requestUrl = new URL(request.url)
  if (requestUrl.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  if (isStaticAssetRequest(request, requestUrl)) {
    event.respondWith(handleStaticAssetRequest(request, event))
  }
})

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request)

    if (shouldCacheNavigationResponse(response)) {
      const cache = await caches.open(SHELL_CACHE)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    const cache = await caches.open(SHELL_CACHE)
    const cachedResponse =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match('/', { ignoreSearch: true }))

    if (cachedResponse) {
      return cachedResponse
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

function shouldCacheNavigationResponse(response) {
  if (!response.ok) {
    return false
  }

  const cacheControl = (response.headers.get('Cache-Control') || '').toLowerCase()

  if (cacheControl.includes('no-store') || cacheControl.includes('private')) {
    return false
  }

  if (response.headers.has('Set-Cookie')) {
    return false
  }

  return true
}

async function handleStaticAssetRequest(request, event) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone())
        await trimCache(cache, MAX_STATIC_ENTRIES)
      }

      return response
    })
    .catch(() => undefined)

  if (cachedResponse) {
    event.waitUntil(networkPromise)
    return cachedResponse
  }

  const networkResponse = await networkPromise

  if (networkResponse) {
    return networkResponse
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

function isStaticAssetRequest(request, requestUrl) {
  if (requestUrl.pathname.startsWith('/_app/')) return true
  if (requestUrl.pathname.startsWith('/icons/')) return true
  if (requestUrl.pathname.endsWith('.webmanifest')) return true

  return ['style', 'script', 'font', 'image'].includes(request.destination)
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys()

  if (keys.length <= maxEntries) {
    return
  }

  const keysToDelete = keys.slice(0, keys.length - maxEntries)
  await Promise.all(keysToDelete.map((request) => cache.delete(request)))
}
