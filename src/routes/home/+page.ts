import { redirect } from '@sveltejs/kit'
import { getCategoriesCached } from '$lib/features/categories/cache'
import { getRecentRecordsCached } from '$lib/features/records/cache'
import type { ApiError } from '$lib/core/http/api-client'
import type { PageLoad } from './$types'

export const load: PageLoad = async function load() {
  try {
    const [categories, recentRecords] = await Promise.all([
      getCategoriesCached(),
      getRecentRecordsCached(),
    ])
    return { categories, recentRecords, loadError: '' }
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status === 401) {
      throw redirect(302, '/login')
    }

    return {
      categories: [],
      recentRecords: [],
      loadError: error instanceof Error ? error.message : 'Unable to load categories.',
    }
  }
}
