<script lang="ts">
  import { goto } from '$app/navigation'
  import type { Category, RecordItem, UserSettings } from '$lib/core/domain/models'
  import { getFxRates } from '$lib/features/fx/api'
  import { getAllRecordsByDateRange } from '$lib/features/records/query'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import { getSettings } from '$lib/features/settings/api'
  import {
    buildCurrencySubtotals,
    buildRateLookup,
    convertAmountToMainCurrency,
    type CurrencySubtotal,
  } from '$lib/shared/fx'
  import PeriodControls from '$lib/features/periods/components/PeriodControls.svelte'
  import StatsBreakdown from '$lib/features/stats/components/StatsBreakdown.svelte'
  import { type PeriodPreset } from '$lib/shared/date'
  import Block from '$lib/ui/Block.svelte'
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
  type ConvertedSummary = {
    netTotal: number
    incomeTotal: number
    expenseTotal: number
    breakdown: BreakdownItem[]
    mainCurrencyCode: string
  }

  type StatsPageData = PageData & {
    records: RecordItem[]
    categories: Category[]
    settings: UserSettings | null
    periodPreset: PeriodPreset
    startDate: string
    endDate: string
    loadError?: string
  }

  export let data: StatsPageData

  let records: RecordItem[] = data.records
  let categories: Category[] = data.categories
  let settings: UserSettings | null = data.settings
  let loading = false
  let loadError = data.loadError ?? ''
  let conversionMessage = ''
  let currencySubtotals: CurrencySubtotal[] = []
  let convertedRecords: RecordItem[] = []
  let convertedSummary: ConvertedSummary | null = null

  let periodPreset: PeriodPreset = data.periodPreset
  let startDate = data.startDate
  let endDate = data.endDate

  $: mainCurrencyCode = settings?.main_currency ?? 'TWD'
  $: totals = calculateTotals(convertedRecords)
  $: breakdown = buildBreakdown(convertedRecords, categories)
  $: convertedSummary =
    records.length > 0 && convertedRecords.length > 0
      ? {
          netTotal: totals.netTotal,
          incomeTotal: totals.incomeTotal,
          expenseTotal: totals.expenseTotal,
          breakdown,
          mainCurrencyCode,
        }
      : null

  $: if (data) {
    records = data.records
    categories = data.categories
    settings = data.settings
    periodPreset = data.periodPreset
    startDate = data.startDate
    endDate = data.endDate
    loadError = data.loadError ?? ''
    loading = false
  }

  $: if (data) {
    void refreshConvertedStats()
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
      if (!item.category_id) {
        continue
      }

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

  async function ensureSettings(): Promise<UserSettings | null> {
    if (settings) {
      return settings
    }

    try {
      settings = await getSettings()
      return settings
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return null
      }

      return null
    }
  }

  async function refreshConvertedStats(): Promise<void> {
    currencySubtotals = buildCurrencySubtotals(records)

    if (records.length === 0) {
      convertedRecords = []
      conversionMessage = ''
      return
    }

    conversionMessage = 'Loading converted totals...'

    const currentSettings = await ensureSettings()
    if (!currentSettings) {
      convertedRecords = []
      conversionMessage = 'Unable to load settings.'
      return
    }

    try {
      const currencies = Array.from(
        new Set([...records.map((record) => record.currency), currentSettings.main_currency]),
      )
      const response = await getFxRates({
        from: startDate,
        to: endDate,
        quotes: currencies,
      })
      const rates = buildRateLookup(response.rates)

      convertedRecords = records.map((record) => ({
        ...record,
        amount: convertAmountToMainCurrency(
          record.amount,
          record.currency,
          currentSettings.main_currency,
          record.date,
          rates,
        ),
        currency: currentSettings.main_currency,
      }))
      conversionMessage = ''
    } catch (error) {
      convertedRecords = []
      conversionMessage = getErrorMessage(error, 'Unable to load exchange rates.')
    }
  }

  async function fetchStats(): Promise<void> {
    loading = true
    loadError = ''

    try {
      const [nextRecords, cachedCategories, nextSettings] = await Promise.all([
        getAllRecordsByDateRange({
          startDate,
          endDate,
        }),
        getCategoriesCached(),
        getSettings().catch(() => null),
      ])

      records = nextRecords
      categories = cachedCategories
      settings = nextSettings
      await refreshConvertedStats()
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
    {currencySubtotals}
    {convertedSummary}
    conversionMessage={records.length > 0 ? conversionMessage : ''}
    {buildCategoryLinkHref}
  />
</main>
