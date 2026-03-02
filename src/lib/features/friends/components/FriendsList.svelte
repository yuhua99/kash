<script lang="ts">
  import { goto } from '$app/navigation'
  import Block from '$lib/ui/Block.svelte'

  type FriendRelation = {
    id: string
    user_id: string
    pending: boolean
    nickname: string
  }

  export let friends: FriendRelation[] = []
  export let loading = false
  export let loadError = ''

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
