import { createApiClient } from '$lib/core/http/api-client'
import { getClientApiBaseUrl } from '$lib/core/config/env'
import type { CategoriesResponse, Category } from '$lib/core/domain/models'

type CategoryQueryParams = {
  limit?: number
  offset?: number
  search?: string
}

type CreateCategoryPayload = {
  name: string
  is_income: boolean
}

type UpdateCategoryPayload = {
  name: string
}

const client = createApiClient({
  fetch,
  baseUrl: getClientApiBaseUrl(),
})

export function getCategories(params: CategoryQueryParams = {}): Promise<CategoriesResponse> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.limit !== undefined) query.set('limit', String(params.limit))
  if (params.offset !== undefined) query.set('offset', String(params.offset))
  return client.request<CategoriesResponse>(client.withQuery('/categories', query))
}

export function createCategory(body: CreateCategoryPayload): Promise<Category> {
  return client.request<Category>('/categories', {
    method: 'POST',
    body,
  })
}

export function updateCategory(id: string, body: UpdateCategoryPayload): Promise<Category> {
  return client.request<Category>(`/categories/${id}`, {
    method: 'PUT',
    body,
  })
}

export function deleteCategory(id: string): Promise<void> {
  return client.request<void>(`/categories/${id}`, {
    method: 'DELETE',
  })
}
