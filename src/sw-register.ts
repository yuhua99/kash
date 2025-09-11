export function registerSW() {
  // Only register in production builds on browsers that support SW
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Proactively check for updates
        try {
          registration.update()
        } catch {
          /* noop */
        }

        // If a new worker is installed, tell it to skip waiting
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

        // When the active worker changes, reload once to get fresh HTML/assets
        let reloaded = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return
          reloaded = true
          window.location.reload()
        })
      })
      .catch(() => {
        // Silent failure would hide update issues; log to console for debugging
        // but do not crash the app
        console.error('[SW] registration failed')
      })
  })
}
