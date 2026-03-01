import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type {
  CreateSplitPayload,
  CreateSplitResponse,
  SplitListResponse,
} from '$lib/core/domain/models'

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export function createSplit(payload: CreateSplitPayload): Promise<CreateSplitResponse> {
  return client.request<CreateSplitResponse>('/splits/create', {
    method: 'POST',
    body: payload,
  })
}

type SplitListQueryParams = {
  limit?: number
  offset?: number
}

type SettleAllWithFriendResponse = {
  updated_count: number
}

export function listPendingSplits(params: SplitListQueryParams = {}): Promise<SplitListResponse> {
  const query = new URLSearchParams()
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  return client.request<SplitListResponse>(client.withQuery('/splits/pending', query))
}

export function listUnsettledSplits(
  friendId: string,
  params: SplitListQueryParams = {},
): Promise<SplitListResponse> {
  const query = new URLSearchParams()
  query.set('friend_id', friendId)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  return client.request<SplitListResponse>(client.withQuery('/splits/unsettled', query))
}

export function settleAllUnsettledWithFriend(
  friendId: string,
): Promise<SettleAllWithFriendResponse> {
  return client.request<SettleAllWithFriendResponse>(`/splits/unsettled/${friendId}/settle_all`, {
    method: 'PUT',
  })
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // fallback (shouldn't be needed in modern browsers)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
