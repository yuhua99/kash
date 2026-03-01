import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { RecordItem, RecordsResponse } from '$lib/core/domain/models'

type RecordQueryParams = {
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
  pending?: boolean
  settle?: boolean
}

type CreateRecordPayload = {
  name: string
  amount: number
  category_id: string
  date: string
}

type UpdateRecordPayload = Partial<CreateRecordPayload>

type FinalizePendingPayload = {
  record_id: string
  category_id: string
}

type UpdateSettlePayload = {
  split_id: string
}

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
  if (params.pending !== undefined) query.set('pending', String(params.pending))
  if (params.settle !== undefined) query.set('settle', String(params.settle))
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

export function finalizePendingRecord(body: FinalizePendingPayload): Promise<RecordItem> {
  return client.request<RecordItem>('/records/finalize-pending', {
    method: 'POST',
    body,
  })
}

export function settleRecord(recordId: string, splitId: string): Promise<RecordItem> {
  const body: UpdateSettlePayload = {
    split_id: splitId,
  }

  return client.request<RecordItem>(`/records/${recordId}/settle`, {
    method: 'PUT',
    body,
  })
}
