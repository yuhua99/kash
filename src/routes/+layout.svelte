<script lang="ts">
  import { goto } from '$app/navigation'
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
</script>

<svelte:head>
  <title>Kash</title>
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
