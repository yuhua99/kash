<script lang="ts">
  import { Tabs } from 'bits-ui'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import '$lib/ui/Tabs.css'

  export let createName = ''
  export let createNameError = ''
  export let createType: 'expense' | 'income' = 'expense'
  export let creating = false
  export let onCreateSubmit: (event: SubmitEvent) => void
  export let onCreateTypeChange: (nextValue: string) => void
</script>

<Block title="Add category">
  <form on:submit={onCreateSubmit} novalidate>
    <div>
      <label for="create-category-name">Category name</label>
      <input id="create-category-name" type="text" bind:value={createName} />
      {#if createNameError}
        <p role="alert">{createNameError}</p>
      {/if}
    </div>

    <div>
      <p id="create-category-type">Type</p>
      <Tabs.Root value={createType} onValueChange={onCreateTypeChange}>
        <Tabs.List class="tabs-list" aria-labelledby="create-category-type">
          <Tabs.Trigger class="tabs-trigger" value="expense">Expense</Tabs.Trigger>
          <Tabs.Trigger class="tabs-trigger" value="income">Income</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>

    <Button variant="primary" type="submit" disabled={creating}>
      {creating ? 'Creating...' : 'Create category'}
    </Button>
  </form>
</Block>
