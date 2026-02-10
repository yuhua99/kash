<script lang="ts">
  import Block from '$lib/ui/Block.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import '$lib/ui/Amount.css'

  type BreakdownItem = {
    name: string
    total: number
    share: number
    isIncome: boolean
  }

  export let loading = false
  export let loadError = ''
  export let recordCount = 0
  export let netTotal = 0
  export let incomeTotal = 0
  export let expenseTotal = 0
  export let breakdown: BreakdownItem[] = []
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
        <a href="/home">Home</a>.
      </p>
    {:else}
      <div>
        <p>Net total</p>
        <p class="amount amount--accent">
          {netTotal.toFixed(2)}
        </p>

        <div>
          <div>
            <span>Income</span>
            <span class="amount amount--income">{incomeTotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Expense</span>
            <span class="amount amount--expense">-{expenseTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        {#each breakdown as item}
          <ListRow type={item.total >= 0 ? 'income' : 'expense'}>
            <svelte:fragment slot="main">
              <span>{item.name}</span>
              <span
                class="amount"
                class:amount--income={item.total >= 0}
                class:amount--expense={item.total < 0}
              >
                {item.total.toFixed(2)}
              </span>
            </svelte:fragment>
            <svelte:fragment slot="sub">
              <span>{item.share.toFixed(1)}% of activity</span>
              <span>{item.isIncome ? 'Income' : 'Expense'}</span>
            </svelte:fragment>
            <div aria-hidden="true">
              <div></div>
            </div>
          </ListRow>
        {/each}
      </div>
    {/if}
  </div>
</Block>
