import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'
import { useApiRequest } from '@/composables/useApiRequest'
import { getCategoryColor as getColorFromId } from '@/lib/categoryColors'
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoriesResponse,
} from '@/types'

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const { isLoading, error, clearError, executeRequest } = useApiRequest()

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

  const incomeCategories = computed(() => {
    return categories.value.filter((category) => category.is_income)
  })

  const expenseCategories = computed(() => {
    return categories.value.filter((category) => !category.is_income)
  })

  const getCategoryName = (categoryId: string): string => {
    return categoriesMap.value.get(categoryId) || 'Unknown Category'
  }

  const getCategoryId = (categoryName: string): string | null => {
    return categoriesNameMap.value.get(categoryName) || null
  }

  const getCategoryColor = (categoryId: string): string => {
    return getColorFromId(categoryId)
  }


  const fetchCategories = async (): Promise<boolean> => {
    const data = await executeRequest(() => api.get<CategoriesResponse>('/categories'), {
      onSuccess: (response) => {
        categories.value = response.categories
      },
    })

    return !!data
  }

  const createCategory = async (payload: CreateCategoryPayload): Promise<Category | null> => {
    const data = await executeRequest(() => api.post<Category>('/categories', payload), {
      onSuccess: (newCategory) => {
        categories.value.push(newCategory)
      },
    })

    return data
  }

  const updateCategory = async (id: string, payload: UpdateCategoryPayload): Promise<boolean> => {
    const data = await executeRequest(() => api.put<Category>(`/categories/${id}`, payload), {
      onSuccess: (updatedCategory) => {
        const index = categories.value.findIndex((cat) => cat.id === id)
        if (index !== -1) {
          categories.value[index] = updatedCategory
        }
      },
    })

    return !!data
  }

  const deleteCategory = async (id: string): Promise<boolean> => {
    const success = await executeRequest(() => api.delete<void>(`/categories/${id}`), {
      onSuccess: () => {
        categories.value = categories.value.filter((cat) => cat.id !== id)
      },
    })

    return success !== null
  }

  return {
    categories,
    isLoading,
    error,
    categoriesMap,
    categoriesNameMap,
    incomeCategories,
    expenseCategories,
    getCategoryName,
    getCategoryId,
    getCategoryColor,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
  }
})
