/**
 * Category-related types
 */

export interface Category {
  id: string;
  name: string;
  is_income: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  is_income?: boolean;
}

export interface UpdateCategoryPayload {
  name: string;
  is_income?: boolean;
}

export interface CategoriesResponse {
  categories: Category[];
  total_count: number;
  limit: number;
  offset: number;
}
