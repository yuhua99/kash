<script lang="ts">
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import type { ApiError } from '$lib/core/http/api-client'
  import type { FriendRelation, SplitListItem } from '$lib/core/domain/models'
  import { listFriends, removeFriend, updateNickname } from '$lib/features/friends/api'
  import { invalidateFriendsCache } from '$lib/features/friends/cache'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { listUnsettledSplits, settleAllUnsettledWithFriend } from '$lib/features/splits/api'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import { toast } from '$lib/ui/toast'
  import '$lib/ui/Amount.css'
  import { amountDisplayMode, formatSignedAmount } from '$lib/shared/amount-display'

  const unsettledQuery = {
    limit: 1000,
    offset: 0,
  } as const

  let loading = false
  let loadError = ''
  let friend: FriendRelation | null = null
  let splits: SplitListItem[] = []
  let loadedFriendId = ''

  let nicknameValue = ''
  let savingNickname = false

  let settleDialogOpen = false
  let settlingAll = false

  let removeDialogOpen = false
  let removingFriend = false

  $: friendId = $page.params.friendId ?? ''
  $: youOweTotal = splits
    .filter((item) => item.direction === 'you_owe')
    .reduce((sum, item) => sum + item.amount, 0)
  $: theyOweYouTotal = splits
    .filter((item) => item.direction === 'they_owe_you')
    .reduce((sum, item) => sum + item.amount, 0)
  $: netAmount = theyOweYouTotal - youOweTotal

  $: if (browser && friendId && loadedFriendId !== friendId) {
    loadedFriendId = friendId
    void fetchFriendUnsettled()
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
      return error.message
    }

    return fallbackMessage
  }

  function amountClass(value: number): 'amount--income' | 'amount--expense' | 'amount--accent' {
    if (value > 0) {
      return 'amount--income'
    }

    if (value < 0) {
      return 'amount--expense'
    }

    return 'amount--accent'
  }

  function sortByDateDesc(left: SplitListItem, right: SplitListItem): number {
    return right.date.localeCompare(left.date)
  }

  async function fetchFriendUnsettled(): Promise<void> {
    if (!friendId) {
      return
    }

    loading = true
    loadError = ''

    try {
      const [friendsResponse, unsettledResponse] = await Promise.all([
        listFriends({ pending: false, limit: 1000, offset: 0 }),
        listUnsettledSplits(friendId, unsettledQuery),
      ])

      const matchedFriend =
        friendsResponse.friends.find((item) => item.user_id === friendId) ?? null
      if (!matchedFriend) {
        friend = null
        splits = []
        nicknameValue = ''
        loadError = 'Friend not found.'
        return
      }

      friend = matchedFriend
      nicknameValue = matchedFriend.nickname
      splits = unsettledResponse.splits.slice().sort(sortByDateDesc)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }

      loadError = getErrorMessage(error, 'Unable to load friend unsettled records.')
      toast.error(loadError)
    } finally {
      loading = false
    }
  }

  async function saveNickname(): Promise<void> {
    if (!friend || savingNickname) {
      return
    }

    const nextNickname = nicknameValue.trim()
    if (nextNickname.length > 50) {
      toast.error('Nickname must be 50 characters or less.')
      return
    }

    savingNickname = true

    try {
      const updated = await updateNickname(friend.user_id, nextNickname ? nextNickname : null)
      friend = {
        ...friend,
        nickname: updated.nickname,
      }
      nicknameValue = updated.nickname
      invalidateFriendsCache()
      toast.success('Nickname updated.')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }

      toast.error(getErrorMessage(error, 'Unable to update nickname.'))
    } finally {
      savingNickname = false
    }
  }

  function onSettleDialogOpenChange(nextOpen: boolean): void {
    if (settlingAll) {
      settleDialogOpen = true
      return
    }

    settleDialogOpen = nextOpen
  }

  async function settleAll(): Promise<void> {
    if (!friend || settlingAll || splits.length === 0) {
      return
    }

    settlingAll = true

    try {
      const response = await settleAllUnsettledWithFriend(friend.user_id)
      invalidateRecordsCache()

      if (response.updated_count > 0) {
        toast.success(`Settled ${response.updated_count} records.`)
      } else {
        toast.info('No unsettled records to settle.')
      }

      settleDialogOpen = false
      await fetchFriendUnsettled()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }

      toast.error(getErrorMessage(error, 'Unable to settle records.'))
    } finally {
      settlingAll = false
    }
  }

  function onRemoveDialogOpenChange(nextOpen: boolean): void {
    if (removingFriend) {
      removeDialogOpen = true
      return
    }

    removeDialogOpen = nextOpen
  }

  async function removeCurrentFriend(): Promise<void> {
    if (!friend || removingFriend) {
      return
    }

    removingFriend = true

    try {
      await removeFriend(friend.user_id)
      invalidateFriendsCache()
      invalidateRecordsCache()
      toast.success('Friend removed.')
      await goto('/settings/friends')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }

      toast.error(getErrorMessage(error, 'Unable to remove friend.'))
    } finally {
      removingFriend = false
    }
  }
</script>

<main>
  <Block title="Balance">
    {#if loading}
      <p>Loading friend balance...</p>
    {:else if loadError}
      <p role="alert">{loadError}</p>
    {:else if friend}
      <ListRow type={netAmount >= 0 ? 'income' : 'expense'}>
        <svelte:fragment slot="main">
          <span>Total</span>
          <span class={`amount ${amountClass(netAmount)}`}
            >{formatSignedAmount(netAmount, $amountDisplayMode)}</span
          >
        </svelte:fragment>
      </ListRow>

      <Button
        variant="primary"
        type="button"
        onclick={() => (settleDialogOpen = true)}
        disabled={settlingAll || splits.length === 0}
      >
        {settlingAll ? 'Settling...' : 'Settle all'}
      </Button>
    {/if}
  </Block>

  <Block title="Records">
    {#if loading}
      <p>Loading records...</p>
    {:else if loadError}
      <p role="alert">{loadError}</p>
    {:else if splits.length === 0}
      <p>No unsettled records with this friend.</p>
    {:else}
      {#each splits as item (item.record_id)}
        <ListRow type={item.direction === 'you_owe' ? 'expense' : 'income'}>
          <svelte:fragment slot="main">
            <span>{item.description}</span>
            <span
              class={`amount ${item.direction === 'you_owe' ? 'amount--expense' : 'amount--income'}`}
            >
              {formatSignedAmount(
                item.direction === 'you_owe' ? -item.amount : item.amount,
                $amountDisplayMode,
              )} {item.currency}
            </span>
          </svelte:fragment>
          <svelte:fragment slot="sub">
            <span>{item.date}</span>
            <span>{item.direction === 'you_owe' ? 'You owe' : 'They owe you'}</span>
          </svelte:fragment>
        </ListRow>
      {/each}
    {/if}
  </Block>

  <Block title="Friend settings">
    {#if !friend}
      <p>Friend information unavailable.</p>
    {:else}
      <div class="friend-settings-field">
        <label for="friend-nickname">Nickname</label>
        <input id="friend-nickname" type="text" bind:value={nicknameValue} maxlength="50" />
      </div>

      <div class="friend-settings-actions">
        <Button
          variant="primary"
          type="button"
          onclick={() => void saveNickname()}
          disabled={savingNickname}
        >
          {savingNickname ? 'Saving...' : 'Save nickname'}
        </Button>
        <Button
          variant="destructive"
          type="button"
          onclick={() => (removeDialogOpen = true)}
          disabled={removingFriend}
        >
          {removingFriend ? 'Removing...' : 'Remove friend'}
        </Button>
      </div>
    {/if}
  </Block>
</main>

<ConfirmDialog
  open={settleDialogOpen}
  onOpenChange={onSettleDialogOpenChange}
  title="Settle all records?"
  description="This will mark unsettled split records between both of you as settled."
  confirmLabel="Settle all"
  confirmBusyLabel="Settling..."
  busy={settlingAll}
  onConfirm={settleAll}
/>

<ConfirmDialog
  open={removeDialogOpen}
  onOpenChange={onRemoveDialogOpenChange}
  title="Remove friend?"
  description={friend ? `This will remove your connection with ${friend.nickname}.` : ''}
  confirmLabel="Remove"
  confirmBusyLabel="Removing..."
  busy={removingFriend}
  onConfirm={removeCurrentFriend}
/>

<style>
  .friend-settings-field {
    display: grid;
    gap: 6px;
  }

  .friend-settings-actions {
    display: flex;
    gap: 8px;
  }
</style>
