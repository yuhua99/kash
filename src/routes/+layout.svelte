<script lang="ts">
  import { dev } from '$app/environment'
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import '../app.css'
  import './+layout.css'
  import { page } from '$app/stores'
  import { Dialog, Menubar } from 'bits-ui'
  import type { ApiError } from '$lib/core/http/api-client'
  import type { FriendRelation, SplitListItem } from '$lib/core/domain/models'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import { acceptFriend, listFriends, removeFriend } from '$lib/features/friends/api'
  import { invalidateFriendsCache } from '$lib/features/friends/cache'
  import { notifyFriendsSync } from '$lib/features/friends/sync'
  import { finalizePendingRecord } from '$lib/features/records/api'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { listPendingSplits } from '$lib/features/splits/api'
  import Button from '$lib/ui/Button.svelte'
  import ButtonRow from '$lib/ui/ButtonRow.svelte'
  import SelectField from '$lib/ui/SelectField.svelte'
  import ToastHost from '$lib/ui/ToastHost.svelte'
  import { toast } from '$lib/ui/toast'
  import '$lib/ui/Dialog.css'
  import { amountDisplayMode, formatAmount } from '$lib/shared/amount-display'

  export let data: App.PageData

  type PendingInboxItem =
    | {
        kind: 'friend'
        key: string
        friend: FriendRelation
      }
    | {
        kind: 'split'
        key: string
        split: SplitListItem
      }

  type SelectFieldItem = {
    value: string
    label: string
  }

  const navItems = [
    { href: '/home', label: 'KASH!' },
    { href: '/records', label: 'Records' },
    { href: '/categories', label: 'Categories' },
    { href: '/stats', label: 'Stats' },
    { href: '/settings', label: 'Settings' },
  ]

  const authRoutes = new Set(['/login', '/register'])
  const MOBILE_MAX_WIDTH_PX = 719
  const SWIPE_LOCK_THRESHOLD_PX = 10
  const SWIPE_MIN_DISTANCE_PX = 56
  const SWIPE_DIRECTION_RATIO = 1.2
  const SWIPE_RELEASE_VELOCITY_PX_PER_MS = 0.45
  const SWIPE_EDGE_GUARD_PX = 20
  const SWIPE_EDGE_RESISTANCE = 0.35
  const SWIPE_COMPLETE_MS = 140
  const SWIPE_SNAPBACK_MS = 180
  const SWIPE_SUPPRESS_CLICK_MS = 350
  const pendingQuery = {
    limit: 1000,
    offset: 0,
  } as const

  let pendingInboxQueue: PendingInboxItem[] = []
  let pendingInboxAttemptedUserId: string | null = null
  let pendingInboxLoading = false
  let processingPendingAction = false
  let pendingFriendAction: 'accept' | 'decline' | null = null

  let splitCategoryItems: SelectFieldItem[] = []
  let splitCategoryId = ''
  let splitCategoryError = ''
  let splitCategoryLoading = false
  let activeSplitRecordId: string | null = null

  let swipeStartX: number | null = null
  let swipeStartY: number | null = null
  let swipeStartTime = 0
  let swipeLastX = 0
  let swipeLastTime = 0
  let swipeIgnoreCurrentGesture = false
  let swipeHorizontalLocked = false
  let swipeVerticalLocked = false
  let swipeNavigating = false
  let swipeOffsetX = 0
  let swipeTransitionMs = 0
  let swipeNavigateTimer: ReturnType<typeof setTimeout> | null = null
  let swipeSuppressClickUntil = 0

  $: pathname = $page.url.pathname
  $: isAuthRoute = authRoutes.has(pathname)
  $: activePendingItem = pendingInboxQueue[0] ?? null
  $: activePendingFriend = activePendingItem?.kind === 'friend' ? activePendingItem.friend : null
  $: activePendingSplit = activePendingItem?.kind === 'split' ? activePendingItem.split : null
  $: splitCategoryLabel =
    splitCategoryItems.find((item) => item.value === splitCategoryId)?.label ??
    (splitCategoryLoading ? 'Loading categories...' : 'Select category')

  $: if (!data.user) {
    resetPendingInboxState()
  }

  $: if (
    data.user &&
    !isAuthRoute &&
    pendingInboxAttemptedUserId !== data.user.id &&
    !pendingInboxLoading
  ) {
    void bootstrapPendingInbox()
  }

  $: if (activePendingSplit && activeSplitRecordId !== activePendingSplit.record_id) {
    activeSplitRecordId = activePendingSplit.record_id
    splitCategoryError = ''
    splitCategoryId = ''

    if (!splitCategoryItems.length && !splitCategoryLoading) {
      void loadSplitCategories()
    }
  }

  $: if (!activePendingSplit) {
    activeSplitRecordId = null
    splitCategoryError = ''
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return fallbackMessage
  }

  function resetPendingInboxState(): void {
    pendingInboxQueue = []
    pendingInboxAttemptedUserId = null
    pendingInboxLoading = false
    processingPendingAction = false
    pendingFriendAction = null
    splitCategoryItems = []
    splitCategoryId = ''
    splitCategoryError = ''
    splitCategoryLoading = false
    activeSplitRecordId = null
  }

  function dismissCurrentPendingItem(): void {
    pendingInboxQueue = pendingInboxQueue.slice(1)
  }

  async function loadSplitCategories(): Promise<void> {
    splitCategoryLoading = true
    splitCategoryError = ''

    try {
      const categories = await getCategoriesCached()
      const expenseCategories = categories.filter((category) => !category.is_income)
      const preferredCategories = expenseCategories.length ? expenseCategories : categories

      splitCategoryItems = preferredCategories.map((category) => ({
        value: category.id,
        label: category.name,
      }))

      if (!splitCategoryItems.length) {
        splitCategoryId = ''
        splitCategoryError = 'Create at least one category before saving this split.'
        return
      }

      if (splitCategoryId && !splitCategoryItems.some((item) => item.value === splitCategoryId)) {
        splitCategoryId = ''
      }
    } catch (error) {
      splitCategoryItems = []
      splitCategoryId = ''
      splitCategoryError = getErrorMessage(error, 'Unable to load categories.')
    } finally {
      splitCategoryLoading = false
    }
  }

  async function bootstrapPendingInbox(): Promise<void> {
    if (!data.user || isAuthRoute || pendingInboxLoading) {
      return
    }

    const userId = data.user.id
    pendingInboxAttemptedUserId = userId
    pendingInboxLoading = true

    try {
      const [pendingFriendsResult, pendingSplitsResult] = await Promise.allSettled([
        listFriends({ pending: true, ...pendingQuery }),
        listPendingSplits(pendingQuery),
      ])

      if (pendingFriendsResult.status === 'rejected') {
        const apiError = pendingFriendsResult.reason as ApiError
        if (apiError.status === 401) {
          await goto('/login')
          return
        }
        throw pendingFriendsResult.reason
      }

      if (pendingSplitsResult.status === 'rejected') {
        const apiError = pendingSplitsResult.reason as ApiError
        if (apiError.status === 401) {
          await goto('/login')
          return
        }
        toast.error(getErrorMessage(pendingSplitsResult.reason, 'Unable to check pending splits.'))
      }

      const pendingFriends = pendingFriendsResult.value.friends
      const pendingSplits =
        pendingSplitsResult.status === 'fulfilled' ? pendingSplitsResult.value.splits : []

      pendingInboxQueue = [
        ...pendingFriends.map((friend: FriendRelation) => ({
          kind: 'friend' as const,
          key: `friend:${friend.user_id}`,
          friend,
        })),
        ...pendingSplits.map((split: SplitListItem) => ({
          kind: 'split' as const,
          key: `split:${split.record_id}`,
          split,
        })),
      ]

      if (pendingSplits.length > 0) {
        await loadSplitCategories()
      }
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }

      toast.error(getErrorMessage(error, 'Unable to check pending requests.'))
    } finally {
      pendingInboxLoading = false
    }
  }

  async function handlePendingActionError(
    error: unknown,
    fallbackMessage: string,
    staleMessage: string,
  ): Promise<void> {
    const apiError = error as ApiError

    if (apiError.status === 401) {
      await goto('/login')
      return
    }

    if (apiError.status === 404 || apiError.status === 409) {
      toast.info(staleMessage)
      dismissCurrentPendingItem()
      return
    }

    toast.error(getErrorMessage(error, fallbackMessage))
  }

  function onSplitCategoryChange(nextCategoryId: string): void {
    splitCategoryId = nextCategoryId
    splitCategoryError = ''
  }

  function onPendingDialogOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      return
    }
  }

  async function acceptPendingFriend(): Promise<void> {
    if (!activePendingFriend || processingPendingAction) {
      return
    }

    processingPendingAction = true
    pendingFriendAction = 'accept'

    try {
      await acceptFriend(activePendingFriend.user_id)
      invalidateFriendsCache()
      notifyFriendsSync()
      toast.success('Friend request accepted.')
      dismissCurrentPendingItem()
    } catch (error) {
      await handlePendingActionError(
        error,
        'Unable to accept friend request.',
        'This friend request was already handled.',
      )
    } finally {
      processingPendingAction = false
      pendingFriendAction = null
    }
  }

  async function declinePendingFriend(): Promise<void> {
    if (!activePendingFriend || processingPendingAction) {
      return
    }

    processingPendingAction = true
    pendingFriendAction = 'decline'

    try {
      await removeFriend(activePendingFriend.user_id)
      invalidateFriendsCache()
      notifyFriendsSync()
      toast.success('Friend request declined.')
      dismissCurrentPendingItem()
    } catch (error) {
      await handlePendingActionError(
        error,
        'Unable to decline friend request.',
        'This friend request was already handled.',
      )
    } finally {
      processingPendingAction = false
      pendingFriendAction = null
    }
  }

  async function savePendingSplit(): Promise<void> {
    if (!activePendingSplit || processingPendingAction) {
      return
    }

    if (!splitCategoryId) {
      splitCategoryError = 'Select a category before saving.'
      return
    }

    processingPendingAction = true

    try {
      await finalizePendingRecord({
        record_id: activePendingSplit.record_id,
        category_id: splitCategoryId,
      })
      invalidateRecordsCache()
      toast.success('Split saved.')
      dismissCurrentPendingItem()
    } catch (error) {
      await handlePendingActionError(
        error,
        'Unable to save split.',
        'This split was already handled.',
      )
    } finally {
      processingPendingAction = false
    }
  }

  function isActive(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function createNavClickHandler(href: string): () => void {
    return function handleNavClick(): void {
      void goto(href)
    }
  }

  function isMobileViewport(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches
  }

  function shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    return Boolean(
      target.closest(
        'input, textarea, select, button, [contenteditable], .menubar, .dialog-content, .dialog-overlay, [role="dialog"]',
      ),
    )
  }

  function suppressNextInteractiveClick(): void {
    swipeSuppressClickUntil = performance.now() + SWIPE_SUPPRESS_CLICK_MS
  }

  function handleWindowClickCapture(event: MouseEvent): void {
    if (swipeSuppressClickUntil === 0) {
      return
    }

    if (performance.now() > swipeSuppressClickUntil) {
      swipeSuppressClickUntil = 0
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    if (!target.closest('a, button')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    swipeSuppressClickUntil = 0
  }

  function resetSwipeGesture(): void {
    swipeStartX = null
    swipeStartY = null
    swipeStartTime = 0
    swipeLastX = 0
    swipeLastTime = 0
    swipeIgnoreCurrentGesture = false
    swipeHorizontalLocked = false
    swipeVerticalLocked = false
  }

  function clearSwipeNavigateTimer(): void {
    if (swipeNavigateTimer === null) {
      return
    }

    clearTimeout(swipeNavigateTimer)
    swipeNavigateTimer = null
  }

  function resetSwipeMotion(): void {
    swipeTransitionMs = 0
    swipeOffsetX = 0
  }

  function snapBackSwipeMotion(): void {
    swipeTransitionMs = SWIPE_SNAPBACK_MS
    swipeOffsetX = 0
  }

  function handleTouchStart(event: TouchEvent): void {
    if (swipeNavigating) {
      return
    }

    resetSwipeGesture()
    clearSwipeNavigateTimer()
    resetSwipeMotion()

    if (!data.user || isAuthRoute || activePendingItem || !isMobileViewport()) {
      return
    }

    const touch = event.touches[0]
    if (!touch) {
      return
    }

    if (
      touch.clientX <= SWIPE_EDGE_GUARD_PX ||
      touch.clientX >= window.innerWidth - SWIPE_EDGE_GUARD_PX
    ) {
      swipeIgnoreCurrentGesture = true
      return
    }

    swipeIgnoreCurrentGesture = shouldIgnoreSwipeTarget(event.target)
    if (swipeIgnoreCurrentGesture) {
      return
    }

    swipeStartTime = performance.now()
    swipeStartX = touch.clientX
    swipeStartY = touch.clientY
    swipeLastX = touch.clientX
    swipeLastTime = swipeStartTime
  }

  function getActiveNavIndex(currentPathname: string): number {
    for (let index = 0; index < navItems.length; index += 1) {
      if (isActive(currentPathname, navItems[index].href)) {
        return index
      }
    }

    return -1
  }

  function navigateBySwipe(deltaX: number): void {
    if (swipeNavigating) {
      return
    }

    const currentIndex = getActiveNavIndex(pathname)
    if (currentIndex < 0) {
      return
    }

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= navItems.length) {
      return
    }

    const nextHref = navItems[nextIndex].href
    if (nextHref === pathname) {
      return
    }

    swipeNavigating = true

    swipeTransitionMs = SWIPE_COMPLETE_MS
    swipeOffsetX = deltaX < 0 ? -window.innerWidth : window.innerWidth

    clearSwipeNavigateTimer()
    swipeNavigateTimer = setTimeout(() => {
      swipeNavigateTimer = null
      void goto(nextHref).finally(() => {
        swipeNavigating = false
        resetSwipeMotion()
      })
    }, SWIPE_COMPLETE_MS)
  }

  function getSwipeOffsetWithResistance(deltaX: number): number {
    const currentIndex = getActiveNavIndex(pathname)
    if (currentIndex < 0) {
      return 0
    }

    const isDraggingPastFirst = currentIndex === 0 && deltaX > 0
    const isDraggingPastLast = currentIndex === navItems.length - 1 && deltaX < 0
    if (isDraggingPastFirst || isDraggingPastLast) {
      return deltaX * SWIPE_EDGE_RESISTANCE
    }

    return deltaX
  }

  function handleTouchMove(event: TouchEvent): void {
    if (swipeIgnoreCurrentGesture || swipeNavigating || !isMobileViewport()) {
      return
    }

    const startX = swipeStartX
    const startY = swipeStartY
    if (startX === null || startY === null) {
      return
    }

    const touch = event.touches[0]
    if (!touch) {
      return
    }

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (!swipeHorizontalLocked && !swipeVerticalLocked) {
      if (absX < SWIPE_LOCK_THRESHOLD_PX && absY < SWIPE_LOCK_THRESHOLD_PX) {
        return
      }

      if (absX >= absY * SWIPE_DIRECTION_RATIO) {
        swipeHorizontalLocked = true
      } else if (absY >= absX * SWIPE_DIRECTION_RATIO) {
        swipeVerticalLocked = true
        return
      } else {
        return
      }
    }

    if (swipeVerticalLocked || !swipeHorizontalLocked) {
      return
    }

    event.preventDefault()
    swipeTransitionMs = 0
    swipeOffsetX = getSwipeOffsetWithResistance(deltaX)
    swipeLastX = touch.clientX
    swipeLastTime = performance.now()
  }

  function handleTouchEnd(event: TouchEvent): void {
    const startX = swipeStartX
    const startY = swipeStartY
    const startTime = swipeStartTime
    const lastX = swipeLastX
    const lastTime = swipeLastTime
    const ignoreGesture = swipeIgnoreCurrentGesture
    const wasHorizontalLocked = swipeHorizontalLocked
    resetSwipeGesture()

    if (ignoreGesture || startX === null || startY === null || !isMobileViewport()) {
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) {
      snapBackSwipeMotion()
      return
    }

    if (!wasHorizontalLocked) {
      resetSwipeMotion()
      return
    }

    suppressNextInteractiveClick()

    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    const now = performance.now()
    const totalElapsedMs = Math.max(1, now - startTime)
    const recentElapsedMs = Math.max(1, now - lastTime)
    const totalVelocity = deltaX / totalElapsedMs
    const recentVelocity = (touch.clientX - lastX) / recentElapsedMs
    const releaseVelocity =
      Math.abs(recentVelocity) > Math.abs(totalVelocity) ? recentVelocity : totalVelocity

    const meetsDistanceThreshold =
      absX >= SWIPE_MIN_DISTANCE_PX && absX > absY * SWIPE_DIRECTION_RATIO
    const meetsVelocityThreshold =
      Math.abs(releaseVelocity) >= SWIPE_RELEASE_VELOCITY_PX_PER_MS && absX > absY

    if (!meetsDistanceThreshold && !meetsVelocityThreshold) {
      snapBackSwipeMotion()
      return
    }

    const currentIndex = getActiveNavIndex(pathname)
    if (currentIndex < 0) {
      snapBackSwipeMotion()
      return
    }

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= navItems.length) {
      snapBackSwipeMotion()
      return
    }

    navigateBySwipe(deltaX)
  }

  function handleTouchCancel(): void {
    if (swipeHorizontalLocked) {
      suppressNextInteractiveClick()
    }

    resetSwipeGesture()
    if (!swipeNavigating) {
      snapBackSwipeMotion()
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
      clearSwipeNavigateTimer()
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      window.removeEventListener('load', registerServiceWorker)
    }
  })
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

<svelte:window
  on:click|capture={handleWindowClickCapture}
  on:touchstart={handleTouchStart}
  on:touchmove|nonpassive={handleTouchMove}
  on:touchend={handleTouchEnd}
  on:touchcancel={handleTouchCancel}
/>

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

  <ToastHost />

  <div
    class="swipe-content"
    style={`--swipe-offset-x: ${swipeOffsetX}px; --swipe-transition-ms: ${swipeTransitionMs}ms;`}
  >
    <slot />
  </div>

  {#if activePendingFriend}
    <Dialog.Root open={true} onOpenChange={onPendingDialogOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="dialog-overlay" />
        <Dialog.Content class="dialog-content pending-inbox-dialog">
          <Dialog.Title>Friend request</Dialog.Title>
          <Dialog.Description>
            {activePendingFriend.nickname} sent you a friend request.
          </Dialog.Description>

          <ButtonRow>
            <Button
              variant="secondary"
              type="button"
              onclick={() => void declinePendingFriend()}
              disabled={processingPendingAction}
            >
              {pendingFriendAction === 'decline' ? 'Declining...' : 'Decline'}
            </Button>
            <Button
              variant="primary"
              type="button"
              onclick={() => void acceptPendingFriend()}
              disabled={processingPendingAction}
            >
              {pendingFriendAction === 'accept' ? 'Accepting...' : 'Accept'}
            </Button>
          </ButtonRow>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  {/if}

  {#if activePendingSplit}
    <Dialog.Root open={true} onOpenChange={onPendingDialogOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="dialog-overlay" />
        <Dialog.Content class="dialog-content pending-inbox-dialog">
          <Dialog.Title>Pending split</Dialog.Title>
          <Dialog.Description>
            Review this split, pick a category, and save it to your records.
          </Dialog.Description>

          <div class="pending-split-details">
            <p><span>From</span><strong>{activePendingSplit.requested_by_name}</strong></p>
            <p><span>Name</span><strong>{activePendingSplit.description}</strong></p>
            <p><span>Date</span><strong>{activePendingSplit.date}</strong></p>
            <p>
              <span>Amount</span><strong
                >{formatAmount(activePendingSplit.amount, $amountDisplayMode)} {activePendingSplit.currency}</strong
              >
            </p>
          </div>

          <div class="pending-split-category">
            <label for="pending-split-category">Category</label>
            <SelectField
              id="pending-split-category"
              value={splitCategoryId}
              label={splitCategoryLabel}
              items={splitCategoryItems}
              disabled={splitCategoryLoading ||
                !splitCategoryItems.length ||
                processingPendingAction}
              onValueChange={onSplitCategoryChange}
            />

            {#if splitCategoryError}
              <p class="pending-split-category__error" role="alert">{splitCategoryError}</p>
            {/if}

            {#if !splitCategoryLoading && !splitCategoryItems.length}
              <Button variant="secondary" type="button" onclick={() => void loadSplitCategories()}>
                Retry categories
              </Button>
            {/if}
          </div>

          <Button
            variant="primary"
            type="button"
            className="pending-split-save"
            onclick={() => void savePendingSplit()}
            disabled={processingPendingAction ||
              splitCategoryLoading ||
              !splitCategoryItems.length ||
              !splitCategoryId}
          >
            {processingPendingAction ? 'Saving...' : 'Save'}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  {/if}
</div>
