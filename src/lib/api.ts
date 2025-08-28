import type { ApiResponse, RequestOptions } from '@/types'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api') {
    this.baseURL = baseURL
  }

  private async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    try {
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // For session cookies
      }

      if (options.body && method !== 'GET') {
        config.body = JSON.stringify(options.body)
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config)

      if (response.ok) {
        let data: T
        const contentType = response.headers.get('content-type')

        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          data = (await response.text()) as T
        }

        return {
          data,
          success: true,
        }
      } else {
        const errorText = await response.text()
        return {
          error: errorText || `HTTP ${response.status}: ${response.statusText}`,
          success: false,
        }
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error occurred',
        success: false,
      }
    }
  }

  async get<T = unknown>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, { headers })
  }

  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { body, headers })
  }

  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { body, headers })
  }

  async delete<T = unknown>(
    endpoint: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, { headers })
  }
}

// Export a singleton instance
export const api = new ApiClient()

// Export types for use in components
export type { ApiResponse }
