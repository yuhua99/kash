import { redirect } from '@sveltejs/kit'
import { getCategoriesCached } from '$lib/features/categories/cache'
import { filterRecordsByDateRange, getRecentRecordsCached } from '$lib/features/records/cache'
import { periodFromPreset, type PeriodPreset } from '$lib/shared/date'
import { validateDate } from '$lib/shared/validation'
import type { ApiError } from '$lib/core/http/api-client'
import type { Category } from '$lib/core/domain/models'
import type { PageLoad } from './$types'

type SortMode = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
type CategoryFilterMode = 'all_expenses' | 'all_incomes' | 'pending' | `category:${string}`

const DEFAULT_PERIOD_PRESET: PeriodPreset = 'month'
const DEFAULT_CATEGORY_FILTER: CategoryFilterMode = 'all_expenses'
const DEFAULT_SORT_MODE: SortMode = 'date_desc'

function parsePeriodPreset(value: string | null): PeriodPreset | null {
  if (value === 'month' || value === 'year' || value === 'custom') {
    return value
  }

  return null
}

function resolveDateRangeFromQuery(searchParams: URLSearchParams): {
  periodPreset: PeriodPreset
  startDate: string
  endDate: string
} {
  const parsedPreset = parsePeriodPreset(searchParams.get('preset')) ?? DEFAULT_PERIOD_PRESET
  const startDate = searchParams.get('start')?.trim() ?? ''
  const endDate = searchParams.get('end')?.trim() ?? ''

  const startIsValid = validateDate(startDate) === null
  const endIsValid = validateDate(endDate) === null

  if (startIsValid && endIsValid && startDate <= endDate) {
    return {
      periodPreset: parsedPreset,
      startDate,
      endDate,
    }
  }

  const fallbackPreset = parsedPreset === 'custom' ? DEFAULT_PERIOD_PRESET : parsedPreset
  const fallbackRange = periodFromPreset(fallbackPreset)

  return {
    periodPreset: fallbackPreset,
    startDate: fallbackRange.start,
    endDate: fallbackRange.end,
  }
}

function resolveCategoryFilterFromQuery(
  value: string | null,
  categories: Category[],
): CategoryFilterMode {
  if (value === 'all_expenses' || value === 'all_incomes' || value === 'pending') {
    return value
  }

  if (!value || !value.startsWith('category:')) {
    return DEFAULT_CATEGORY_FILTER
  }

  const categoryId = value.slice('category:'.length)
  if (!categoryId) {
    return DEFAULT_CATEGORY_FILTER
  }

  if (!categories.some((category) => category.id === categoryId)) {
    return DEFAULT_CATEGORY_FILTER
  }

  return `category:${categoryId}`
}

function resolveSortModeFromQuery(value: string | null): SortMode {
  if (
    value === 'date_desc' ||
    value === 'date_asc' ||
    value === 'amount_desc' ||
    value === 'amount_asc'
  ) {
    return value
  }

  return DEFAULT_SORT_MODE
}

export const load: PageLoad = async function load({ url }) {
  const { periodPreset, startDate, endDate } = resolveDateRangeFromQuery(url.searchParams)
  const sortMode = resolveSortModeFromQuery(url.searchParams.get('sort'))

  try {
    const [cachedRecords, cachedCategories] = await Promise.all([
      getRecentRecordsCached(),
      getCategoriesCached(),
    ])

    const categoryFilter = resolveCategoryFilterFromQuery(
      url.searchParams.get('category'),
      cachedCategories,
    )

    const initialRecords = filterRecordsByDateRange(cachedRecords, startDate, endDate)

    return {
      periodPreset,
      startDate,
      endDate,
      records: initialRecords,
      categories: cachedCategories,
      categoryFilter,
      sortMode,
      loadError: '',
    }
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status === 401) {
      throw redirect(302, '/login')
    }

    return {
      periodPreset,
      startDate,
      endDate,
      records: [],
      categories: [],
      categoryFilter: DEFAULT_CATEGORY_FILTER,
      sortMode,
      loadError: error instanceof Error ? error.message : 'Unable to load records.',
    }
  }
}
