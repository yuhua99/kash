const FALLBACK_API_BASE_URL = '/api'

export function getClientApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || FALLBACK_API_BASE_URL
}
