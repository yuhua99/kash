<script lang="ts">
  import { goto } from '$app/navigation'
  import { createEventDispatcher, onDestroy } from 'svelte'
  import type { ApiError } from '$lib/core/http/api-client'
  import { searchUsers, sendFriendRequest } from '$lib/features/friends/api'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import { toast } from '$lib/ui/toast'

  type PublicUser = {
    id: string
    username: string
  }

  const dispatch = createEventDispatcher<{ requested: { userId: string } }>()

  export let existingFriendUserIds: string[] = []
  export let pendingFriendUserIds: string[] = []

  let query = ''
  let results: PublicUser[] = []
  let searchLoading = false
  let searchError = ''
  let requestingUserId: string | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let searchRequestId = 0

  $: normalizedQuery = query.trim()
  $: existingIds = new Set(existingFriendUserIds)
  $: pendingIds = new Set(pendingFriendUserIds)
  $: {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    if (normalizedQuery.length < 3) {
      results = []
      searchLoading = false
      searchError = ''
    } else {
      debounceTimer = setTimeout(() => {
        void runSearch(normalizedQuery)
      }, 300)
    }
  }

  onDestroy(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  })

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }
    return fallbackMessage
  }

  function isUnavailable(user: PublicUser): boolean {
    return existingIds.has(user.id) || pendingIds.has(user.id)
  }

  async function runSearch(nextQuery: string): Promise<void> {
    const requestId = ++searchRequestId
    searchLoading = true
    searchError = ''

    try {
      const found = await searchUsers({ query: nextQuery })
      if (requestId !== searchRequestId) {
        return
      }
      results = found
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      if (requestId !== searchRequestId) {
        return
      }
      results = []
      searchError = getErrorMessage(error, 'Unable to search users.')
      toast.error(searchError)
    } finally {
      if (requestId === searchRequestId) {
        searchLoading = false
      }
    }
  }

  async function onRequest(user: PublicUser): Promise<void> {
    if (requestingUserId || isUnavailable(user)) {
      return
    }

    requestingUserId = user.id

    try {
      await sendFriendRequest(user.username)
      toast.success(`Friend request sent to ${user.username}.`)
      dispatch('requested', { userId: user.id })
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      if (apiError.status === 409) {
        toast.error(`Request already sent to ${user.username} — waiting for their response.`)
        return
      }
      toast.error(getErrorMessage(error, 'Unable to send request.'))
    } finally {
      requestingUserId = null
    }
  }
</script>

<Block title="Find friends">
  <div>
    <label for="friend-query">Username</label>
    <input id="friend-query" type="text" bind:value={query} placeholder="Search by username" />
  </div>

  {#if normalizedQuery.length === 0}{:else if normalizedQuery.length < 3}
    <p>Type at least 3 characters to search users.</p>
  {:else if searchLoading}
    <p>Loading...</p>
  {:else if searchError}
    <p role="alert">{searchError}</p>
  {:else if results.length === 0}
    <p>No users found</p>
  {:else}
    <section>
      {#each results as user (user.id)}
        <ListRow>
          <svelte:fragment slot="main">
            <span>{user.username}</span>
          </svelte:fragment>
          <svelte:fragment slot="end">
            <Button
              variant="primary"
              size="compact"
              type="button"
              onclick={() => void onRequest(user)}
              disabled={requestingUserId === user.id || isUnavailable(user)}
            >
              {#if requestingUserId === user.id}
                Requesting...
              {:else if isUnavailable(user)}
                Unavailable
              {:else}
                Request
              {/if}
            </Button>
          </svelte:fragment>
        </ListRow>
      {/each}
    </section>
  {/if}
</Block>

<style>
  section {
    gap: 8px;
  }
</style>
