import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { RecordItem, RecordsResponse } from '$lib/core/domain/models'

type RecordQueryParams = {
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

type CreateRecordPayload = {
  name: string
  amount: number
  category_id: string
  date: string
}

type UpdateRecordPayload = Partial<CreateRecordPayload>

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export function getRecords(params: RecordQueryParams): Promise<RecordsResponse> {
  const query = new URLSearchParams()
  if (params.start_date) query.set('start_date', params.start_date)
  if (params.end_date) query.set('end_date', params.end_date)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  return client.request<RecordsResponse>(client.withQuery('/records', query))
}

export function createRecord(body: CreateRecordPayload): Promise<RecordItem> {
  return client.request<RecordItem>('/records', {
    method: 'POST',
    body,
  })
}

export function updateRecord(id: string, body: UpdateRecordPayload): Promise<RecordItem> {
  return client.request<RecordItem>(`/records/${id}`, {
    method: 'PUT',
    body,
  })
}

export function deleteRecord(id: string): Promise<void> {
  return client.request<void>(`/records/${id}`, {
    method: 'DELETE',
  })
}
