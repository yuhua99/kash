import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, type ApiResponse } from '@/lib/api'

interface PublicUser {
  id: string
  username: string
}

interface LoginPayload {
  username: string
  password: string
}

interface RegisterPayload {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  const login = async (credentials: LoginPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<PublicUser> = await api.post('/auth/login', credentials)

      if (response.success && response.data) {
        user.value = response.data
        return true
      } else {
        error.value = response.error || 'Login failed'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const register = async (credentials: RegisterPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<PublicUser> = await api.post('/auth/register', credentials)

      if (response.success && response.data) {
        user.value = response.data
        return true
      } else {
        error.value = response.error || 'Registration failed'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      await api.post('/auth/logout')
    } catch (err) {
      // Even if logout fails on server, clear local state
      console.warn('Logout request failed:', err)
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
  }
})
