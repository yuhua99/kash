import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { User } from '$lib/core/domain/models'

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export async function getMe(fetchImpl: typeof fetch = fetch): Promise<User | null> {
  const response = await fetchImpl(`${getClientApiBaseUrl()}/auth/me`, {
    credentials: 'include',
  })
  if (response.status === 401) {
    return null
  }
  if (!response.ok) {
    throw new Error('Unable to verify session.')
  }
  return response.json() as Promise<User>
}

export function register(username: string, password: string): Promise<User> {
  return client.request<User>('/auth/register', {
    method: 'POST',
    body: { username, password },
  })
}

export function login(username: string, password: string): Promise<User> {
  return client.request<User>('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function logout(): Promise<void> {
  return client.request<void>('/auth/logout', {
    method: 'POST',
  })
}
