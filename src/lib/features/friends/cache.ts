import type { FriendRelation } from '$lib/core/domain/models'
import { listFriends } from '$lib/features/friends/api'

let acceptedCache: FriendRelation[] | null = null
let acceptedRequest: Promise<FriendRelation[]> | null = null
let cacheVersion = 0

async function fetchAcceptedFriends(): Promise<FriendRelation[]> {
  const response = await listFriends({ pending: false, limit: 1000, offset: 0 })
  return response.friends
}

export function invalidateFriendsCache(): void {
  cacheVersion += 1
  acceptedCache = null
  acceptedRequest = null
}

export async function getAcceptedFriendsCached(): Promise<FriendRelation[]> {
  if (acceptedCache) {
    return acceptedCache
  }

  if (acceptedRequest) {
    return acceptedRequest
  }

  const requestVersion = cacheVersion

  acceptedRequest = fetchAcceptedFriends()
    .then((friends) => {
      if (requestVersion === cacheVersion) {
        acceptedCache = friends
      }
      return friends
    })
    .finally(() => {
      acceptedRequest = null
    })

  return acceptedRequest
}
