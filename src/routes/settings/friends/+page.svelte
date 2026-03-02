<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import type { ApiError } from '$lib/core/http/api-client'
  import { getAcceptedFriendsCached, invalidateFriendsCache } from '$lib/features/friends/cache'
  import { friendsSyncRevision } from '$lib/features/friends/sync'
  import FriendSearch from '$lib/features/friends/components/FriendSearch.svelte'
  import FriendsList from '$lib/features/friends/components/FriendsList.svelte'
  import { toast } from '$lib/ui/toast'

  type FriendRelation = {
    id: string
    user_id: string
    pending: boolean
    nickname: string
  }

  let friends: FriendRelation[] = []
  let loading = false
  let loadError = ''

  $: allFriendIds = friends.map((friend) => friend.user_id)

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return fallbackMessage
  }

  async function refetchAll(): Promise<void> {
    loading = true
    loadError = ''
    try {
      friends = await getAcceptedFriendsCached()
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
  <FriendSearch existingFriendUserIds={allFriendIds} on:requested={() => void onRequested()} />

  <FriendsList {friends} {loading} {loadError} />
</main>
