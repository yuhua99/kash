import { redirect } from '@sveltejs/kit'
import type { ApiError } from '$lib/core/http/api-client'
import { getSettings } from '$lib/features/settings/api'
import type { PageLoad } from './$types'

export const load: PageLoad = async function load({ depends }) {
  depends('app:settings')

  try {
    return {
      settings: await getSettings(),
      loadError: '',
    }
  } catch (error) {
    const apiError = error as ApiError
    if (apiError.status === 401) {
      throw redirect(302, '/login')
    }

    return {
      settings: null,
      loadError: error instanceof Error ? error.message : 'Unable to load settings.',
    }
  }
}
