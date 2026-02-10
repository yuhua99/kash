import { redirect } from '@sveltejs/kit'
import { getCategoriesCached } from '$lib/features/categories/cache'
import { getRecords } from '$lib/features/records/api'
import { periodFromPreset } from '$lib/shared/date'
import type { ApiError } from '$lib/core/http/api-client'
import type { PageLoad } from './$types'

export const load: PageLoad = async function load() {
  const initialRange = periodFromPreset('month')

  try {
    const [recordsResponse, cachedCategories] = await Promise.all([
      getRecords({
        start_date: initialRange.start,
        end_date: initialRange.end,
        limit: 1000,
        offset: 0,
      }),
      getCategoriesCached(),
    ])

    return {
      periodPreset: 'month',
      startDate: initialRange.start,
      endDate: initialRange.end,
      records: recordsResponse.records,
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
