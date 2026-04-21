import { redirect } from '@sveltejs/kit'
import { getCategoriesCached } from '$lib/features/categories/cache'
import { getAllRecordsByDateRange } from '$lib/features/records/query'
import { getSettings } from '$lib/features/settings/api'
import { periodFromPreset } from '$lib/shared/date'
import type { ApiError } from '$lib/core/http/api-client'
import type { PageLoad } from './$types'

export const load: PageLoad = async function load() {
  const initialRange = periodFromPreset('month')

  try {
    const [initialRecords, cachedCategories] = await Promise.all([
      getAllRecordsByDateRange({
        startDate: initialRange.start,
        endDate: initialRange.end,
      }),
      getCategoriesCached(),
    ])

    let settings = null
    try {
      settings = await getSettings()
    } catch {
      settings = null
    }

    return {
      periodPreset: 'month',
      startDate: initialRange.start,
      endDate: initialRange.end,
      records: initialRecords,
      categories: cachedCategories,
      settings,
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
      settings: null,
      loadError: error instanceof Error ? error.message : 'Unable to load stats.',
    }
  }
}
