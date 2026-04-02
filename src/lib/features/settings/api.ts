import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { UserSettings } from '$lib/core/domain/models'

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export function getSettings(): Promise<UserSettings> {
  return client.request<UserSettings>('/settings')
}

export function updateSettings(mainCurrencyCode: string): Promise<UserSettings> {
  return client.request<UserSettings>('/settings', {
    method: 'PUT',
    body: {
      main_currency_code: mainCurrencyCode,
    },
  })
}
