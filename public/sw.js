const CACHE_NAME = 'kash-html-v1';

self.addEventListener('install', (event) => {
  // Activate new SW immediately
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(['/', '/index.html', '/manifest.webmanifest']))
      .catch(() => void 0)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Allow page to tell SW to activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for navigations/HTML to pick up new deploys
  if (req.mode === 'navigate' || (req.destination === 'document' && url.origin === self.location.origin)) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req, { cache: 'no-store' });
          const cache = await caches.open(CACHE_NAME);
          cache.put('/index.html', res.clone());
          return res;
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/index.html');
          if (cached) return cached;
          // Last resort, try normal fetch
          return fetch(req);
        }
      })()
    );
    return;
  }

  // Only handle GET requests for assets
  if (req.method !== 'GET') return;

  // Stale-while-revalidate for common static assets
  if (['style', 'script', 'image', 'font'].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === 'opaque')) {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => undefined);

        if (cached) {
          // Return cached immediately, update in background
          fetchPromise; // fire-and-forget
          return cached;
        }

        // No cache: wait for network, fallback to default fetch
        const res = await fetchPromise;
        return res || fetch(req);
      })()
    );
    return;
  }

  // Otherwise, fall through to default browser handling.
});
