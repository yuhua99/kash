import { ref } from 'vue'
import type { ApiResponse } from '@/lib/api'

export interface ApiRequestOptions<T = unknown> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

/**
 * Composable for standardized API request handling with loading states and error management
 */
export function useApiRequest() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const clearError = () => {
    error.value = null
  }

  const executeRequest = async <T>(
    requestFn: () => Promise<ApiResponse<T>>,
    options: ApiRequestOptions<T> = {},
  ): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await requestFn()

      if (response.success && response.data !== undefined) {
        options.onSuccess?.(response.data)
        return response.data
      } else {
        const errorMessage = response.error || 'Request failed'
        error.value = errorMessage
        options.onError?.(errorMessage)
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred'
      error.value = errorMessage
      options.onError?.(errorMessage)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    clearError,
    executeRequest,
  }
}
