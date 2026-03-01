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

  export let data: App.PageData

  let pending = false

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
    <a href="/settings/friends" class="list-row list-row--link">
      <div class="list-row-main">
        <span>Friends</span>
        <span class="list-row-chevron">›</span>
      </div>
    </a>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Username</span>
        <span>{data.user?.username ?? 'Unknown'}</span>
      </svelte:fragment>
    </ListRow>

    <Button variant="destructive" type="button" onclick={onLogout} disabled={pending}>
      {pending ? 'Signing out...' : 'Log out'}
    </Button>
  </Block>
</main>

<style>
  a.list-row {
    text-decoration: none;
    color: var(--text);
    cursor: pointer;
  }

  a.list-row:hover {
    background: var(--surface-hover, var(--surface));
    filter: brightness(1.1);
  }

  .list-row-chevron {
    color: var(--text-muted);
    font-size: 18px;
  }
</style>
