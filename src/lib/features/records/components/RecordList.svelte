<script lang="ts">
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import Button from '$lib/ui/Button.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import '$lib/ui/ActionRow.css'
  import '$lib/ui/Amount.css'
  import '$lib/ui/SectionList.css'
  import { amountDisplayMode, formatAmount } from '$lib/shared/amount-display'

  type DateGroup = {
    date: string
    records: RecordItem[]
  }

  export let loading = false
  export let loadError = ''
  export let filteredRecords: RecordItem[] = []
  export let groupedRecords: DateGroup[] = []
  export let shouldGroupByDate = true
  export let categoryById: Map<string, Category> = new Map()
  export let activeActionRowId: string | null = null
  export let deletingId: string | null = null
  export let onRowShellClick: (event: MouseEvent, recordId: string) => void
  export let onRowShellKeydown: (event: KeyboardEvent, recordId: string) => void
  export let startEdit: (record: RecordItem) => void
  export let requestDeleteRecord: (record: RecordItem) => void
</script>

<div aria-live="polite">
  {#if loading}
    <p>Loading records...</p>
  {:else if loadError}
    <p role="alert">{loadError}</p>
  {:else if filteredRecords.length === 0}
    <p>
      No matches. Add new records from
      <a class="text-link" href="/home">Home</a>.
    </p>
  {:else}
    <div class="section-list">
      {#if shouldGroupByDate}
        {#each groupedRecords as group (group.date)}
          <section class="section-compact" aria-labelledby={`records-date-${group.date}`}>
            <p id={`records-date-${group.date}`}>{group.date}</p>
            {#each group.records as record (record.id)}
              <div
                data-action-row-shell
                class="row-action-shell"
                data-type={record.amount > 0 ? 'income' : 'expense'}
                role="button"
                tabindex="0"
                on:click={(event) => onRowShellClick(event, record.id)}
                on:keydown={(event) => onRowShellKeydown(event, record.id)}
              >
                <ListRow type={record.amount > 0 ? 'income' : 'expense'}>
                  <div slot="main">{record.name}</div>
                  <div slot="end">
                    <div
                      class="amount"
                      class:amount--income={record.amount > 0}
                      class:amount--expense={record.amount < 0}
                    >
                      {formatAmount(record.amount, $amountDisplayMode)}
                    </div>
                  </div>
                  <svelte:fragment slot="sub">
                    <span>{categoryById.get(record.category_id)?.name ?? 'Unknown category'}</span>
                  </svelte:fragment>
                </ListRow>
                {#if activeActionRowId === record.id}
                  <div class="row-action-panel">
                    <Button size="compact" type="button" onclick={() => startEdit(record)}>
                      Edit
                    </Button>
                    <Button
                      size="compact"
                      type="button"
                      disabled={deletingId === record.id}
                      onclick={() => requestDeleteRecord(record)}
                    >
                      {deletingId === record.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                {/if}
              </div>
            {/each}
          </section>
        {/each}
      {:else}
        {#each filteredRecords as record (record.id)}
          <div
            data-action-row-shell
            class="row-action-shell"
            data-type={record.amount > 0 ? 'income' : 'expense'}
            role="button"
            tabindex="0"
            on:click={(event) => onRowShellClick(event, record.id)}
            on:keydown={(event) => onRowShellKeydown(event, record.id)}
          >
            <ListRow type={record.amount > 0 ? 'income' : 'expense'}>
              <div slot="main">{record.name}</div>
              <div slot="end">
                <div
                  class="amount"
                  class:amount--income={record.amount > 0}
                  class:amount--expense={record.amount < 0}
                >
                  {formatAmount(record.amount, $amountDisplayMode)}
                </div>
              </div>
              <svelte:fragment slot="sub">
                <span>{categoryById.get(record.category_id)?.name ?? 'Unknown category'}</span>
              </svelte:fragment>
            </ListRow>
            {#if activeActionRowId === record.id}
              <div class="row-action-panel">
                <Button size="compact" type="button" onclick={() => startEdit(record)}>Edit</Button>
                <Button
                  size="compact"
                  type="button"
                  disabled={deletingId === record.id}
                  onclick={() => requestDeleteRecord(record)}
                >
                  {deletingId === record.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
