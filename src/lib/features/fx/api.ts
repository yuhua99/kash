import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { FxRatesResponse } from '$lib/core/domain/models'

type GetFxRatesParams = {
  from: string
  to: string
  quotes: string[]
}

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export function getFxRates(params: GetFxRatesParams): Promise<FxRatesResponse> {
  const query = new URLSearchParams({
    from: params.from,
    to: params.to,
    quotes: params.quotes.join(','),
  })

  return client.request<FxRatesResponse>(client.withQuery('/fx/rates', query))
}
