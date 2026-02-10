export type ApiError = Error & { status?: number }

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

type RequestOptions = {
  method?: RequestMethod
  body?: unknown
  headers?: Record<string, string>
}

export type ApiClientOptions = {
  fetch: typeof fetch
  baseUrl: string
  defaultHeaders?: Record<string, string>
}

const JSON_CONTENT_TYPE = 'application/json'

async function getApiErrorMessage(response: Response): Promise<string | null> {
  try {
    const parsed = (await response.json()) as { message?: string; error?: string }
    return parsed.message ?? parsed.error ?? null
  } catch {
    return null
  }
}

function withQuery(path: string, query: URLSearchParams): string {
  const queryString = query.toString()
  if (!queryString) {
    return path
  }

  return `${path}?${queryString}`
}

function resolveBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

export function createApiClient(options: ApiClientOptions) {
  const { fetch: fetchImpl } = options
  const baseUrl = resolveBaseUrl(options.baseUrl)
  const defaultHeaders = options.defaultHeaders ?? {}

  async function request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
    const method = requestOptions.method ?? 'GET'
    const hasBody = requestOptions.body !== undefined

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(hasBody ? { 'Content-Type': JSON_CONTENT_TYPE } : {}),
        ...defaultHeaders,
        ...(requestOptions.headers ?? {}),
      },
      body: hasBody ? JSON.stringify(requestOptions.body) : undefined,
    })

    if (!response.ok) {
      const fallbackMessage = `Request failed (${response.status})`
      const message = (await getApiErrorMessage(response)) ?? fallbackMessage
      const error = new Error(message) as ApiError
      error.status = response.status
      throw error
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }

  return {
    request,
    withQuery,
  }
}
