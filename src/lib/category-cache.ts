import { getCategories } from '$lib/api'
import type { Category } from '$lib/types'

const CATEGORY_QUERY = {
  limit: 1000,
  offset: 0,
} as const

let categoriesCache: Category[] | null = null
let categoriesRequest: Promise<Category[]> | null = null
let categoriesCacheVersion = 0

async function fetchCategoriesFromApi(): Promise<Category[]> {
  const response = await getCategories(CATEGORY_QUERY)
  return response.categories
}

export function setCategoriesCache(categories: Category[]): void {
  categoriesCache = categories
}

export function invalidateCategoriesCache(): void {
  categoriesCacheVersion += 1
  categoriesCache = null
  categoriesRequest = null
}

export async function getCategoriesCached(): Promise<Category[]> {
  if (categoriesCache) {
    return categoriesCache
  }

  if (categoriesRequest) {
    return categoriesRequest
  }

  const requestVersion = categoriesCacheVersion

  categoriesRequest = fetchCategoriesFromApi()
    .then((categories) => {
      if (requestVersion === categoriesCacheVersion) {
        categoriesCache = categories
      }
      return categories
    })
    .finally(() => {
      categoriesRequest = null
    })

  return categoriesRequest
}
