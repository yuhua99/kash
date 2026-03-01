<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import type { ApiError } from '$lib/core/http/api-client'
  import { acceptFriend, listFriends, removeFriend } from '$lib/features/friends/api'
  import { getAcceptedFriendsCached, invalidateFriendsCache } from '$lib/features/friends/cache'
  import { friendsSyncRevision } from '$lib/features/friends/sync'
  import FriendSearch from '$lib/features/friends/components/FriendSearch.svelte'
  import FriendsList from '$lib/features/friends/components/FriendsList.svelte'
  import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
  import { toast } from '$lib/ui/toast'

  type FriendRelation = {
    id: string
    user_id: string
    pending: boolean
    nickname: string
  }

  let friends: FriendRelation[] = []
  let pendingIncoming: FriendRelation[] = []
  let loading = false
  let loadError = ''
  let acceptingId: string | null = null
  let removingId: string | null = null

  let removeDialogOpen = false
  let removeTarget: { userId: string; label: string } | null = null

  $: allFriendIds = [
    ...friends.map((friend) => friend.user_id),
    ...pendingIncoming.map((friend) => friend.user_id),
  ]
  $: pendingIds = pendingIncoming.map((friend) => friend.user_id)

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return fallbackMessage
  }

  async function handleApiError(error: unknown, fallbackMessage: string): Promise<void> {
    const apiError = error as ApiError
    if (apiError.status === 401) {
      await goto('/login')
      return
    }
    toast.error(getErrorMessage(error, fallbackMessage))
  }

  async function refetchAll(): Promise<void> {
    loading = true
    loadError = ''
    try {
      const [accepted, pending] = await Promise.all([
        getAcceptedFriendsCached(),
        listFriends({ pending: true, limit: 1000, offset: 0 }).then((response) => response.friends),
      ])

      friends = accepted
      pendingIncoming = pending
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      loadError = getErrorMessage(error, 'Unable to load friends.')
      toast.error(loadError)
    } finally {
      loading = false
    }
  }

  async function onRequested(): Promise<void> {
    invalidateFriendsCache()
    await refetchAll()
  }

  async function refreshAfterMutation(successMessage: string): Promise<void> {
    invalidateFriendsCache()
    await invalidate('app:friends')
    toast.success(successMessage)
    await refetchAll()
  }

  async function onAccept(userId: string): Promise<void> {
    if (acceptingId || removingId) {
      return
    }

    acceptingId = userId
    try {
      await acceptFriend(userId)
      await refreshAfterMutation('Friend request accepted.')
    } catch (error) {
      await handleApiError(error, 'Unable to accept friend request.')
    } finally {
      acceptingId = null
    }
  }

  function onRemove(userId: string): void {
    const pending = pendingIncoming.find((item) => item.user_id === userId)
    if (!pending) {
      return
    }

    removeTarget = {
      userId,
      label: pending.nickname || pending.user_id,
    }
    removeDialogOpen = true
  }

  function onRemoveDialogOpenChange(nextOpen: boolean): void {
    if (removingId) {
      removeDialogOpen = true
      return
    }
    removeDialogOpen = nextOpen
    if (!nextOpen) {
      removeTarget = null
    }
  }

  async function confirmRemove(): Promise<void> {
    if (!removeTarget || removingId) {
      return
    }

    removingId = removeTarget.userId
    try {
      await removeFriend(removeTarget.userId)
      removeDialogOpen = false
      removeTarget = null
      await refreshAfterMutation('Friend request declined.')
    } catch (error) {
      await handleApiError(error, 'Unable to update friendship.')
    } finally {
      removingId = null
    }
  }

  onMount(() => {
    let isInitialSyncEvent = true

    const unsubscribe = friendsSyncRevision.subscribe(() => {
      if (isInitialSyncEvent) {
        isInitialSyncEvent = false
        return
      }

      void refetchAll()
    })

    void refetchAll()

    return () => {
      unsubscribe()
    }
  })
</script>

<main>
  <FriendSearch
    existingFriendUserIds={allFriendIds}
    pendingFriendUserIds={pendingIds}
    on:requested={() => void onRequested()}
  />

  <FriendsList
    {friends}
    {pendingIncoming}
    {loading}
    {loadError}
    {acceptingId}
    {removingId}
    onAccept={(userId) => void onAccept(userId)}
    {onRemove}
  />

  <p class="friends-hint">Tap a friend to view unsettled records and manage that friend.</p>
</main>

<ConfirmDialog
  open={removeDialogOpen}
  onOpenChange={onRemoveDialogOpenChange}
  title="Decline friend request?"
  description={removeTarget ? `This will update your connection with ${removeTarget.label}.` : ''}
  confirmLabel="Decline"
  confirmBusyLabel="Declining..."
  busy={removingId !== null}
  onConfirm={confirmRemove}
/>

<style>
  .friends-hint {
    color: var(--text-muted);
    margin-top: 8px;
  }
</style>
