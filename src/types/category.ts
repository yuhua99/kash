/**
 * Category-related types
 */

export interface Category {
  id: string
  name: string
}

export interface CreateCategoryPayload {
  name: string
}

export interface UpdateCategoryPayload {
  name: string
}

export interface CategoriesResponse {
  categories: Category[]
  total_count: number
  limit: number
  offset: number
}
