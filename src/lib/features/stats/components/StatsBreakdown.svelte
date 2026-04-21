<script lang="ts">
  import Block from '$lib/ui/Block.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import '$lib/ui/Amount.css'
  import { amountDisplayMode, formatAmount, formatSignedAmount } from '$lib/shared/amount-display'
  import type { CurrencySubtotal } from '$lib/shared/fx'

  type BreakdownItem = {
    categoryId: string
    name: string
    total: number
    share: number
    isIncome: boolean
  }
  type ConvertedSummary = {
    netTotal: number
    incomeTotal: number
    expenseTotal: number
    breakdown: BreakdownItem[]
    mainCurrencyCode: string
  }

  export let loading = false
  export let loadError = ''
  export let conversionMessage = ''
  export let recordCount = 0
  export let currencySubtotals: CurrencySubtotal[] = []
  export let convertedSummary: ConvertedSummary | null = null
  export let buildCategoryLinkHref: (categoryId: string) => string = () => '/records'
</script>

<Block title="Category breakdown">
  <div aria-live="polite">
    {#if loading}
      <p>Loading stats...</p>
    {:else if loadError}
      <p role="alert">{loadError}</p>
    {:else if recordCount === 0}
      <p>
        No records exist for this period. Change the date range or add entries from
        <a class="text-link" href="/home">Home</a>.
      </p>
    {:else}
        <div class="stats-summary">
          {#each currencySubtotals as item}
            <div class="stats-summary__row">
              <span class="stats-summary__label">{item.currency}</span>
              <span
                class="amount"
                class:amount--income={item.total > 0}
                class:amount--expense={item.total < 0}
              >
                {formatSignedAmount(item.total, $amountDisplayMode)}
              </span>
            </div>
          {/each}

          {#if conversionMessage}
            <p class="stats-conversion-note" role="status">{conversionMessage}</p>
          {/if}

          {#if convertedSummary}
            <div class="stats-summary__row">
              <span class="stats-summary__label">Total</span>
              <span
                class="amount"
                class:amount--income={convertedSummary.netTotal > 0}
                class:amount--expense={convertedSummary.netTotal < 0}
              >
                {formatSignedAmount(convertedSummary.netTotal, $amountDisplayMode)}
              </span>
            </div>

            <div class="stats-summary__row">
              <span class="stats-summary__label"
                >Income/Expense ({convertedSummary.mainCurrencyCode})</span
              >
              <span class="stats-summary__pair">
                <span class="amount amount--income"
                  >{formatAmount(convertedSummary.incomeTotal, $amountDisplayMode)}</span
                >
                <span class="stats-summary__slash">/</span>
                <span class="amount amount--expense"
                  >{formatSignedAmount(-convertedSummary.expenseTotal, $amountDisplayMode)}</span
                >
              </span>
            </div>
          {/if}
        </div>

        {#if convertedSummary}
          <div class="stats-list">
            {#each convertedSummary.breakdown as item}
              <a class="stats-row-link" href={buildCategoryLinkHref(item.categoryId)}>
                <ListRow type={item.total >= 0 ? 'income' : 'expense'}>
                  <svelte:fragment slot="main">
                    <span>{item.name}</span>
                    <span
                      class="amount"
                      class:amount--income={item.total >= 0}
                      class:amount--expense={item.total < 0}
                    >
                      {formatAmount(item.total, $amountDisplayMode)} {convertedSummary.mainCurrencyCode}
                    </span>
                  </svelte:fragment>
                  <svelte:fragment slot="sub">
                    <span>{item.share.toFixed(1)}% of activity</span>
                    <span>{item.isIncome ? 'Income' : 'Expense'}</span>
                  </svelte:fragment>
                  <div aria-hidden="true" class="breakdown-bar">
                    <div
                      class="breakdown-bar__fill"
                      class:breakdown-bar__fill--income={item.total >= 0}
                      class:breakdown-bar__fill--expense={item.total < 0}
                      style="width: {item.share}%"
                    ></div>
                  </div>
                </ListRow>
              </a>
            {/each}
          </div>
        {/if}
    {/if}
  </div>
</Block>

<style>
  .stats-summary {
    display: grid;
    gap: 8px;
    padding-bottom: 24px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .stats-summary__row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
  }

  .stats-summary__pair {
    display: inline-flex;
    align-items: baseline;
    justify-content: flex-end;
    gap: 4px;
  }

  .stats-summary__label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .stats-summary__slash {
    color: var(--text-muted);
  }

  .stats-conversion-note {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
  }

  .stats-list {
    display: grid;
    gap: 8px;
  }

  .stats-row-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  .stats-row-link:hover :global(.list-row) {
    background: var(--panel-strong);
  }

  .stats-row-link:focus-visible {
    outline: none;
  }

  .stats-row-link:focus-visible :global(.list-row) {
    outline: 1px solid var(--accent);
    outline-offset: -1px;
  }

  .breakdown-bar {
    height: 4px;
    background: var(--border);
    margin-top: 12px;
    width: 100%;
  }

  .breakdown-bar__fill {
    height: 100%;
    transition: width 300ms ease-out;
  }

  .breakdown-bar__fill--income {
    background: var(--success);
  }

  .breakdown-bar__fill--expense {
    background: var(--danger);
  }
</style>
