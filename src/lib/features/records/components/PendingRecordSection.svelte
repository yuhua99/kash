<script lang="ts">
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import ListRow from '$lib/ui/ListRow.svelte'
  import '$lib/ui/Amount.css'
  import '$lib/ui/SectionList.css'
  import { amountDisplayMode, formatAmount } from '$lib/shared/amount-display'

  export let pendingRecords: RecordItem[] = []
  export let categoryById: Map<string, Category> = new Map()
</script>

{#if pendingRecords.length > 0}
  <div class="section-list">
    {#each pendingRecords as record (record.id)}
      <ListRow type="expense">
        <div slot="main">{record.name}</div>
        <div slot="end">
          <div class="amount amount--expense">
            {formatAmount(record.amount, $amountDisplayMode)} {record.currency_code}
          </div>
        </div>
        <svelte:fragment slot="sub">
          <span>{categoryById.get(record.category_id)?.name ?? 'Unknown category'}</span>
          <span aria-hidden="true">-</span>
          <span>{record.date}</span>
          <span class="pending-chip">PENDING</span>
        </svelte:fragment>
      </ListRow>
    {/each}
  </div>
{/if}

<style>
  .pending-chip {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border: 1px solid var(--border);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
</style>
