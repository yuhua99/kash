<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import { Button } from 'bits-ui'
  import { logout } from '$lib/features/auth/api'
  import { invalidateCategoriesCache } from '$lib/features/categories/cache'
  import ListRow from '$lib/components/ListRow.svelte'
  import Block from '$lib/components/Block.svelte'

  export let data: App.PageData

  let pending = false
  let formError = ''

  async function onLogout(): Promise<void> {
    pending = true
    formError = ''

    try {
      await logout()
      invalidateCategoriesCache()
      await invalidate('app:auth')
      await goto('/login')
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Unable to logout.'
    } finally {
      pending = false
    }
  }
</script>

<main>
  <Block title="Settings">
    <ListRow>
      <svelte:fragment slot="main">
        <span>Username</span>
        <span>{data.user?.username ?? 'Unknown'}</span>
      </svelte:fragment>
    </ListRow>

    {#if formError}
      <p role="alert">{formError}</p>
    {/if}

    <Button.Root class="btn btn--destructive" type="button" onclick={onLogout} disabled={pending}>
      {pending ? 'Signing out...' : 'Log out'}
    </Button.Root>
  </Block>
</main>
