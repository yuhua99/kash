<script lang="ts">
  import type { Category } from '$lib/core/domain/models'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import '$lib/ui/ActionRow.css'
  import '$lib/ui/SectionList.css'

  export let loading = false
  export let loadError = ''
  export let categories: Category[] = []
  export let incomeCategories: Category[] = []
  export let expenseCategories: Category[] = []
  export let activeActionRowId: string | null = null
  export let deletingId: string | null = null
  export let onRowShellClick: (event: MouseEvent, categoryId: string) => void
  export let onRowShellKeydown: (event: KeyboardEvent, categoryId: string) => void
  export let startEdit: (category: Category) => void
  export let requestDeleteCategory: (category: Category) => void
</script>

<Block title="Categories">
  <div aria-live="polite">
    {#if loading}
      <p>Loading categories...</p>
    {:else if loadError}
      <p role="alert">{loadError}</p>
    {:else if categories.length === 0}
      <p>No categories found. Create one to start organizing records.</p>
    {:else}
      <div class="section-list">
        <section class="section-compact" aria-label="Income">
          {#if incomeCategories.length === 0}
            <p>No income categories yet.</p>
          {:else}
            <div>
              {#each incomeCategories as category}
                <div
                  data-action-row-shell
                  class="row-action-shell"
                  data-type="income"
                  role="button"
                  tabindex="0"
                  on:click={(event) => onRowShellClick(event, category.id)}
                  on:keydown={(event) => onRowShellKeydown(event, category.id)}
                >
                  <ListRow type="income">
                    <span slot="main">{category.name}</span>
                  </ListRow>
                  {#if activeActionRowId === category.id}
                    <div class="row-action-panel">
                      <Button size="compact" type="button" onclick={() => startEdit(category)}>
                        Edit
                      </Button>
                      <Button
                        size="compact"
                        type="button"
                        disabled={deletingId === category.id}
                        onclick={() => requestDeleteCategory(category)}
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <section class="section-compact" aria-labelledby="expense-heading">
          <p id="expense-heading">Expense</p>
          {#if expenseCategories.length === 0}
            <p>No expense categories yet.</p>
          {:else}
            <div>
              {#each expenseCategories as category}
                <div
                  data-action-row-shell
                  class="row-action-shell"
                  data-type="expense"
                  role="button"
                  tabindex="0"
                  on:click={(event) => onRowShellClick(event, category.id)}
                  on:keydown={(event) => onRowShellKeydown(event, category.id)}
                >
                  <ListRow type="expense">
                    <span slot="main">{category.name}</span>
                  </ListRow>
                  {#if activeActionRowId === category.id}
                    <div class="row-action-panel">
                      <Button size="compact" type="button" onclick={() => startEdit(category)}>
                        Edit
                      </Button>
                      <Button
                        size="compact"
                        type="button"
                        disabled={deletingId === category.id}
                        onclick={() => requestDeleteCategory(category)}
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </div>
    {/if}
  </div>
</Block>
