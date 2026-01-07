/**
 * Generic API-related types
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
}
