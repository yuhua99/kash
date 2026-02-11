import { redirect } from '@sveltejs/kit'
import { getCategoriesCached } from '$lib/features/categories/cache'
import { filterRecordsByDateRange, getRecentRecordsCached } from '$lib/features/records/cache'
import { periodFromPreset } from '$lib/shared/date'
import type { ApiError } from '$lib/core/http/api-client'
import type { PageLoad } from './$types'

export const load: PageLoad = async function load() {
  const initialRange = periodFromPreset('month')

  try {
    const [cachedRecords, cachedCategories] = await Promise.all([
      getRecentRecordsCached(),
      getCategoriesCached(),
    ])

    const initialRecords = filterRecordsByDateRange(
      cachedRecords,
      initialRange.start,
      initialRange.end,
    )

    return {
      periodPreset: 'month',
      startDate: initialRange.start,
      endDate: initialRange.end,
      records: initialRecords,
      categories: cachedCategories,
      loadError: '',
    }
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status === 401) {
      throw redirect(302, '/login')
    }

    return {
      periodPreset: 'month',
      startDate: initialRange.start,
      endDate: initialRange.end,
      records: [],
      categories: [],
      loadError: error instanceof Error ? error.message : 'Unable to load records.',
    }
  }
}
