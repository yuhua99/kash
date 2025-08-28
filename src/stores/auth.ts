import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'
import { useApiRequest } from '@/composables/useApiRequest'
import type { PublicUser, LoginPayload, RegisterPayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const { isLoading, error, clearError, executeRequest } = useApiRequest()

  const isAuthenticated = computed(() => user.value !== null)

  const login = async (credentials: LoginPayload): Promise<boolean> => {
    const data = await executeRequest(() => api.post<PublicUser>('/auth/login', credentials), {
      onSuccess: (userData) => {
        user.value = userData
      },
    })
    return !!data
  }

  const register = async (credentials: RegisterPayload): Promise<boolean> => {
    const data = await executeRequest(
      () => api.post<PublicUser>('/auth/register', credentials),
      // Don't set user automatically - require separate login
    )
    return !!data
  }

  const logout = async (): Promise<void> => {
    await executeRequest(() => api.post<void>('/auth/logout'), {
      onError: (err) => {
        // Even if logout fails on server, clear local state
        console.warn('Logout request failed:', err)
      },
    })
    // Always clear local state regardless of server response
    user.value = null
  }

  const checkAuthStatus = async (): Promise<boolean> => {
    const data = await executeRequest(() => api.get<PublicUser>('/auth/me'), {
      onSuccess: (userData) => {
        user.value = userData
      },
      onError: (err) => {
        // Network error or server error
        user.value = null
        console.warn('Auth check failed:', err)
      },
    })

    if (!data) {
      user.value = null
    }

    return !!data
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuthStatus,
    clearError,
  }
})
