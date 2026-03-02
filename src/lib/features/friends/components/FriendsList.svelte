<script lang="ts">
  import { goto } from '$app/navigation'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'

  type FriendRelation = {
    id: string
    user_id: string
    pending: boolean
    nickname: string
  }

  export let friends: FriendRelation[] = []
  export let pendingIncoming: FriendRelation[] = []
  export let loading = false
  export let loadError = ''
  export let acceptingId: string | null = null
  export let removingId: string | null = null
  export let onAccept: (userId: string) => void = () => {}
  export let onRemove: (userId: string) => void = () => {}

  function relationLabel(relation: FriendRelation): string {
    return relation.nickname
  }
</script>

<Block title="Connections">
  {#if loading}
    <p>Loading...</p>
  {:else if loadError}
    <p role="alert">{loadError}</p>
  {:else}
    <section>
      {#if pendingIncoming.length > 0}
        <p>Pending requests</p>
        {#each pendingIncoming as relation (relation.id)}
          <ListRow>
            <svelte:fragment slot="main">
              <span>{relationLabel(relation)}</span>
            </svelte:fragment>
            <svelte:fragment slot="end">
              <Button
                variant="primary"
                size="compact"
                type="button"
                onclick={() => onAccept(relation.user_id)}
                disabled={acceptingId === relation.user_id || removingId === relation.user_id}
              >
                {acceptingId === relation.user_id ? 'Accepting...' : 'Accept'}
              </Button>
              <Button
                variant="secondary"
                size="compact"
                type="button"
                onclick={() => onRemove(relation.user_id)}
                disabled={removingId === relation.user_id || acceptingId === relation.user_id}
              >
                {removingId === relation.user_id ? 'Declining...' : 'Decline'}
              </Button>
            </svelte:fragment>
          </ListRow>
        {/each}
      {:else}
        <p>Pending requests</p>
        <p>No pending requests.</p>
      {/if}
    </section>

    <section>
      <p>Friends</p>
      {#if friends.length === 0}
        <p>No friends yet.</p>
      {:else}
        {#each friends as relation (relation.id)}
          <button
            class="list-row list-row--link"
            onclick={() => goto(`/settings/friends/${relation.user_id}`)}
          >
            <div class="list-row-main">
              <span>{relationLabel(relation)}</span>
              <span class="list-row-chevron">›</span>
            </div>
          </button>
        {/each}
      {/if}
    </section>
  {/if}
</Block>

<style>
  section {
    gap: 8px;
  }

  .list-row-chevron {
    color: var(--text-muted);
    font-size: 18px;
  }
</style>
