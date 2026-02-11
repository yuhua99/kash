<script lang="ts">
  import { dev } from '$app/environment'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import '../app.css'
  import './+layout.css'
  import { page } from '$app/stores'
  import { Menubar } from 'bits-ui'

  export let data: App.PageData

  const navItems = [
    { href: '/home', label: 'KASH!' },
    { href: '/records', label: 'Records' },
    { href: '/categories', label: 'Categories' },
    { href: '/stats', label: 'Stats' },
    { href: '/settings', label: 'Settings' },
  ]

  const authRoutes = new Set(['/login', '/register'])

  $: pathname = $page.url.pathname
  $: isAuthRoute = authRoutes.has(pathname)

  function isActive(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function createNavClickHandler(href: string): () => void {
    return function handleNavClick(): void {
      void goto(href)
    }
  }

  onMount(() => {
    if (dev || !('serviceWorker' in navigator)) {
      return
    }

    const hadControllerBeforeRegistration = Boolean(navigator.serviceWorker.controller)
    let didReloadForUpdate = false
    let shouldReloadForUpdate = false

    const handleControllerChange = (): void => {
      if (!shouldReloadForUpdate || didReloadForUpdate) {
        return
      }

      didReloadForUpdate = true
      window.location.reload()
    }

    const registerServiceWorker = async (): Promise<void> => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        await registration.update()

        const postSkipWaiting = (): void => {
          if (hadControllerBeforeRegistration) {
            shouldReloadForUpdate = true
          }

          registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
        }

        if (registration.waiting) {
          postSkipWaiting()
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing

          if (!installingWorker) {
            return
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              postSkipWaiting()
            }
          })
        })
      } catch (error) {
        console.error('Service worker registration failed', error)
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    if (document.readyState === 'complete') {
      void registerServiceWorker()
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true })
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      window.removeEventListener('load', registerServiceWorker)
    }
  })
</script>

<svelte:head>
  <title>Kash</title>
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#101010" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="KASH!" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap"
  />
</svelte:head>

<div class="app" data-shell={isAuthRoute ? 'auth' : 'app'} data-route={pathname}>
  {#if data.user && !isAuthRoute}
    <Menubar.Root class="menubar" aria-label="Primary">
      {#each navItems as item}
        <Menubar.Menu value={item.href}>
          <Menubar.Trigger
            class={`menubar__trigger ${isActive(pathname, item.href) ? 'is-active' : ''}`}
            onclick={createNavClickHandler(item.href)}
          >
            {item.label}
          </Menubar.Trigger>
        </Menubar.Menu>
      {/each}
    </Menubar.Root>
  {/if}

  <slot />
</div>
