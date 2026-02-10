import { env } from '$env/dynamic/private'

const FALLBACK_API_BASE_URL = 'http://localhost:3000'

export function getServerApiBaseUrl(): string {
  return env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL
}
