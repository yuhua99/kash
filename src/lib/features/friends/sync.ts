import { writable } from 'svelte/store'

const friendsSyncRevisionStore = writable(0)

export const friendsSyncRevision = {
  subscribe: friendsSyncRevisionStore.subscribe,
}

export function notifyFriendsSync(): void {
  friendsSyncRevisionStore.update((value) => value + 1)
}
