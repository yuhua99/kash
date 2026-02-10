import { redirect } from '@sveltejs/kit'
import { getCategoriesCached } from '$lib/features/categories/cache'
import type { ApiError } from '$lib/core/http/api-client'
import type { PageLoad } from './$types'

export const load: PageLoad = async function load() {
  try {
    const categories = await getCategoriesCached()
    return { categories, loadError: '' }
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status === 401) {
      throw redirect(302, '/login')
    }

    return {
      categories: [],
      loadError: error instanceof Error ? error.message : 'Unable to load categories.',
    }
  }
}
