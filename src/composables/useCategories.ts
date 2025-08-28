import { computed } from 'vue'
import { useCategoriesStore } from '@/stores/categories'
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types'

/**
 * Categories composable - provides a clean interface to category-related functionality
 */
export function useCategories() {
  const store = useCategoriesStore()

  // Computed properties
  const categories = computed(() => store.categories)
  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  // Helper computed for UI
  const categoryOptions = computed(() =>
    categories.value.map((cat) => ({
      label: cat.name,
      value: cat.id,
    })),
  )

  const categoryCount = computed(() => categories.value.length)

  // Methods
  const fetchCategories = () => store.fetchCategories()
  const createCategory = (payload: CreateCategoryPayload) => store.createCategory(payload)
  const updateCategory = (id: string, payload: UpdateCategoryPayload) =>
    store.updateCategory(id, payload)
  const deleteCategory = (id: string) => store.deleteCategory(id)
  const clearError = () => store.clearError()

  // Category utility functions
  const getCategoryById = (id: string): Category | undefined =>
    categories.value.find((cat) => cat.id === id)

  const getCategoryByName = (name: string): Category | undefined =>
    categories.value.find((cat) => cat.name === name)

  const getCategoryName = (id: string): string => store.getCategoryName(id)
  const getCategoryId = (name: string): string | null => store.getCategoryId(name)
  const getCategoryColor = (id: string, isDarkMode = false): string =>
    store.getCategoryColor(id, isDarkMode)
  const getCategoryColorByName = (name: string, isDarkMode = false): string =>
    store.getCategoryColorByName(name, isDarkMode)

  return {
    // State
    categories,
    isLoading,
    error,
    categoryOptions,
    categoryCount,

    // Actions
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,

    // Utilities
    getCategoryById,
    getCategoryByName,
    getCategoryName,
    getCategoryId,
    getCategoryColor,
    getCategoryColorByName,
  }
}
