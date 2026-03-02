<script lang="ts">
  import { goto } from '$app/navigation'
  import { getAllRecordsByDateRange } from '$lib/features/records/query'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import PeriodControls from '$lib/features/periods/components/PeriodControls.svelte'
  import StatsBreakdown from '$lib/features/stats/components/StatsBreakdown.svelte'
  import { type PeriodPreset } from '$lib/shared/date'
  import Block from '$lib/ui/Block.svelte'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import type { PageData } from './$types'

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

  type StatsPageData = PageData & {
    records: RecordItem[]
    categories: Category[]
    periodPreset: PeriodPreset
    startDate: string
    endDate: string
    loadError?: string
  }

  export let data: StatsPageData

  let records: RecordItem[] = data.records
  let categories: Category[] = data.categories
  let loading = false
  let loadError = data.loadError ?? ''

  let periodPreset: PeriodPreset = data.periodPreset
  let startDate = data.startDate
  let endDate = data.endDate

  $: totals = calculateTotals(records)
  $: netTotal = totals.netTotal
  $: incomeTotal = totals.incomeTotal
  $: expenseTotal = totals.expenseTotal
  $: breakdown = buildBreakdown(records, categories)

  $: if (data) {
    records = data.records
    categories = data.categories
    periodPreset = data.periodPreset
    startDate = data.startDate
    endDate = data.endDate
    loadError = data.loadError ?? ''
    loading = false
  }

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
      const [nextRecords, cachedCategories] = await Promise.all([
        getAllRecordsByDateRange({
          startDate,
          endDate,
        }),
        getCategoriesCached(),
      ])

      records = nextRecords
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

  function buildCategoryLinkHref(categoryId: string): string {
    const query = new URLSearchParams({
      preset: periodPreset,
      start: startDate,
      end: endDate,
      category: `category:${categoryId}`,
      sort: 'amount_desc',
    })

    return `/records?${query.toString()}`
  }
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

  <StatsBreakdown
    {loading}
    {loadError}
    recordCount={records.length}
    {netTotal}
    {incomeTotal}
    {expenseTotal}
    {breakdown}
    {buildCategoryLinkHref}
  />
</main>
