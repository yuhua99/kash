import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { FriendRelation, FriendsListResponse, PublicUser } from '$lib/core/domain/models'

type SearchUsersParams = {
  query: string
  limit?: number
  offset?: number
}

type ListFriendsParams = {
  pending?: boolean
  limit?: number
  offset?: number
}

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export function searchUsers(params: SearchUsersParams): Promise<PublicUser[]> {
  const query = new URLSearchParams()
  query.set('query', params.query)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  return client.request<PublicUser[]>(client.withQuery('/friends/search', query))
}

export function listFriends(params: ListFriendsParams = {}): Promise<FriendsListResponse> {
  const query = new URLSearchParams()
  if (params.pending !== undefined) query.set('pending', String(params.pending))
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  return client.request<FriendsListResponse>(client.withQuery('/friends/list', query))
}

export function sendFriendRequest(friendUsername: string): Promise<FriendRelation> {
  return client.request<FriendRelation>('/friends/request', {
    method: 'POST',
    body: { friend_username: friendUsername },
  })
}

export function acceptFriend(friendUserId: string): Promise<FriendRelation> {
  return client.request<FriendRelation>('/friends/accept', {
    method: 'POST',
    body: { friend_id: friendUserId },
  })
}

export function removeFriend(friendUserId: string): Promise<void> {
  return client.request<void>('/friends/remove', {
    method: 'POST',
    body: { friend_id: friendUserId },
  })
}

export function updateNickname(
  friendUserId: string,
  nickname: string | null,
): Promise<FriendRelation> {
  return client.request<FriendRelation>('/friends/nickname', {
    method: 'PATCH',
    body: { friend_id: friendUserId, nickname },
  })
}
