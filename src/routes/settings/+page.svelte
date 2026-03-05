<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import Button from '$lib/ui/Button.svelte'
  import { logout } from '$lib/features/auth/api'
  import { invalidateCategoriesCache } from '$lib/features/categories/cache'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { invalidateFriendsCache } from '$lib/features/friends/cache'
  import { toast } from '$lib/ui/toast'
  import Block from '$lib/ui/Block.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import { amountDisplayMode, setAmountDisplayMode } from '$lib/shared/amount-display'

  export let data: App.PageData

  let pending = false

  function toggleDisplayMode(): void {
    setAmountDisplayMode($amountDisplayMode === 'cents' ? 'whole' : 'cents')
  }

  async function onLogout(): Promise<void> {
    pending = true

    try {
      await logout()
      invalidateCategoriesCache()
      invalidateRecordsCache()
      invalidateFriendsCache()
      await invalidate('app:auth')
      toast.success('Signed out.')
      await goto('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to logout.')
    } finally {
      pending = false
    }
  }
</script>

<main>
  <Block title="Settings">
    <button class="list-row list-row--link" onclick={() => goto('/settings/friends')}>
      <div class="list-row-main">
        <span>Friends</span>
        <span class="list-row-chevron">›</span>
      </div>
    </button>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Username</span>
        <span>{data.user?.username ?? 'Unknown'}</span>
      </svelte:fragment>
    </ListRow>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Amount format</span>
        <button class="format-toggle" type="button" onclick={toggleDisplayMode}>
          {$amountDisplayMode === 'cents' ? '123.45' : '123'}
        </button>
      </svelte:fragment>
    </ListRow>

    <Button variant="destructive" type="button" onclick={onLogout} disabled={pending}>
      {pending ? 'Signing out...' : 'Log out'}
    </Button>
  </Block>
</main>

<style>
  .list-row-chevron {
    color: var(--text-muted);
    font-size: 18px;
  }

  .format-toggle {
    background: var(--panel-strong);
    border: 1px solid var(--border);
    color: var(--accent);
    padding: 2px 8px;
    cursor: pointer;
  }

  .format-toggle:hover {
    border-color: var(--accent);
  }
</style>
