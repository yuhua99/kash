import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, type ApiResponse } from '@/lib/api'
import { getCategoryColor as getColorFromId } from '@/lib/categoryColors'

interface Category {
  id: string
  name: string
}

interface CreateCategoryPayload {
  name: string
}

interface UpdateCategoryPayload {
  name: string
}

interface CategoriesResponse {
  categories: Category[]
  total_count: number
  limit: number
  offset: number
}

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const categoriesMap = computed(() => {
    const map = new Map<string, string>()
    categories.value.forEach((category) => {
      map.set(category.id, category.name)
    })
    return map
  })

  const categoriesNameMap = computed(() => {
    const map = new Map<string, string>()
    categories.value.forEach((category) => {
      map.set(category.name, category.id)
    })
    return map
  })

  const getCategoryName = (categoryId: string): string => {
    return categoriesMap.value.get(categoryId) || 'Unknown Category'
  }

  const getCategoryId = (categoryName: string): string | null => {
    return categoriesNameMap.value.get(categoryName) || null
  }

  const getCategoryColor = (categoryId: string, isDarkMode = false): string => {
    return getColorFromId(categoryId, isDarkMode)
  }

  const getCategoryColorByName = (categoryName: string, isDarkMode = false): string => {
    const categoryId = getCategoryId(categoryName)
    return categoryId ? getColorFromId(categoryId, isDarkMode) : '#6b7280'
  }

  const fetchCategories = async (): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<CategoriesResponse> = await api.get('/categories')

      if (response.success && response.data) {
        categories.value = response.data.categories
        return true
      } else {
        error.value = response.error || 'Failed to fetch categories'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const createCategory = async (payload: CreateCategoryPayload): Promise<Category | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<Category> = await api.post('/categories', payload)

      if (response.success && response.data) {
        categories.value.push(response.data)
        return response.data
      } else {
        error.value = response.error || 'Failed to create category'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateCategory = async (id: string, payload: UpdateCategoryPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<Category> = await api.put(`/categories/${id}`, payload)

      if (response.success && response.data) {
        const index = categories.value.findIndex((cat) => cat.id === id)
        if (index !== -1) {
          categories.value[index] = response.data
        }
        return true
      } else {
        error.value = response.error || 'Failed to update category'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteCategory = async (id: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<void> = await api.delete(`/categories/${id}`)

      if (response.success) {
        categories.value = categories.value.filter((cat) => cat.id !== id)
        return true
      } else {
        error.value = response.error || 'Failed to delete category'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    categories,
    isLoading,
    error,
    categoriesMap,
    categoriesNameMap,
    getCategoryName,
    getCategoryId,
    getCategoryColor,
    getCategoryColorByName,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  }
})
