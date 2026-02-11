import { env } from '$env/dynamic/private'

const FALLBACK_API_BASE_URL = 'http://localhost:3000'

export function getServerApiBaseUrl(): string {
  const url = env.SERVER_API_BASE_URL ?? env.VITE_API_BASE_URL ?? FALLBACK_API_BASE_URL

  // Server-side fetch needs an absolute URL; relative paths (e.g. "/api")
  // only work in the browser (via nginx proxy), not from the Node process.
  if (url.startsWith('/')) {
    return FALLBACK_API_BASE_URL
  }

  return url
}
