<script lang="ts">
  import { goto } from '$app/navigation'
  import { getRecords } from '$lib/features/records/api'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import ListRow from '$lib/components/ListRow.svelte'
  import PeriodControls from '$lib/components/PeriodControls.svelte'
  import { periodFromPreset, type PeriodPreset } from '$lib/shared/date'
  import Block from '$lib/components/Block.svelte'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import { onMount } from 'svelte'

  type ApiError = Error & { status?: number }
  type BreakdownItem = {
    categoryId: string
    name: string
    isIncome: boolean
    total: number
    absoluteTotal: number
    share: number
  }
  type Totals = {
    netTotal: number
    incomeTotal: number
    expenseTotal: number
  }

  const initialRange = periodFromPreset('month')

  let records: RecordItem[] = []
  let categories: Category[] = []
  let loading = true
  let loadError = ''

  let periodPreset: PeriodPreset = 'month'
  let startDate = initialRange.start
  let endDate = initialRange.end

  $: totals = calculateTotals(records)
  $: netTotal = totals.netTotal
  $: incomeTotal = totals.incomeTotal
  $: expenseTotal = totals.expenseTotal
  $: breakdown = buildBreakdown(records, categories)

  function calculateTotals(items: RecordItem[]): Totals {
    let netTotal = 0
    let incomeTotal = 0
    let expenseTotal = 0

    for (const item of items) {
      netTotal += item.amount

      if (item.amount > 0) {
        incomeTotal += item.amount
        continue
      }

      if (item.amount < 0) {
        expenseTotal += Math.abs(item.amount)
      }
    }

    return {
      netTotal,
      incomeTotal,
      expenseTotal,
    }
  }

  function buildBreakdown(items: RecordItem[], categoryList: Category[]): BreakdownItem[] {
    const categoryMap = new Map(categoryList.map((category) => [category.id, category]))
    const totals = new Map<string, number>()

    for (const item of items) {
      totals.set(item.category_id, (totals.get(item.category_id) ?? 0) + item.amount)
    }

    const breakdownItems: BreakdownItem[] = []
    for (const [categoryId, total] of totals.entries()) {
      const category = categoryMap.get(categoryId)
      breakdownItems.push({
        categoryId,
        name: category?.name ?? 'Unknown category',
        isIncome: category?.is_income ?? total >= 0,
        total,
        absoluteTotal: Math.abs(total),
        share: 0,
      })
    }

    const grandTotal = breakdownItems.reduce((sum, item) => sum + item.absoluteTotal, 0)

    return breakdownItems
      .map((item) => ({
        ...item,
        share: grandTotal === 0 ? 0 : (item.absoluteTotal / grandTotal) * 100,
      }))
      .sort((left, right) => right.absoluteTotal - left.absoluteTotal)
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage
  }

  async function fetchStats(): Promise<void> {
    loading = true
    loadError = ''

    try {
      const [recordsResponse, cachedCategories] = await Promise.all([
        getRecords({
          start_date: startDate,
          end_date: endDate,
          limit: 1000,
          offset: 0,
        }),
        getCategoriesCached(),
      ])

      records = recordsResponse.records
      categories = cachedCategories
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      loadError = getErrorMessage(error, 'Unable to load stats.')
    } finally {
      loading = false
    }
  }

  async function onPeriodChange(
    event: CustomEvent<{ preset: PeriodPreset; start: string; end: string }>,
  ): Promise<void> {
    periodPreset = event.detail.preset
    startDate = event.detail.start
    endDate = event.detail.end
    await fetchStats()
  }

  onMount(function initStatsPage(): void {
    void fetchStats()
  })
</script>

<main>
  <Block title="Stats">
    <PeriodControls
      bind:preset={periodPreset}
      bind:start={startDate}
      bind:end={endDate}
      disabled={loading}
      on:change={onPeriodChange}
    />
  </Block>

  <Block title="Category breakdown">
    <div aria-live="polite">
      {#if loading}
        <p>Loading stats...</p>
      {:else if loadError}
        <p role="alert">{loadError}</p>
      {:else if records.length === 0}
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
</main>
