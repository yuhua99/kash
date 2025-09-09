/**
 * Transaction-related types
 */

/**
 * Transaction type enum
 */
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

/**
 * Raw API record from the backend
 */
export interface ApiRecord {
  id: string
  name: string
  amount: number
  category_id: string
  timestamp: number
}

/**
 * Main transaction interface
 */
export interface Transaction {
  id: string
  name: string
  amount: number
  category: string
  type: TransactionType
  timestamp: number
}

/**
 * Form data for transaction input (amount as string for form handling)
 */
export interface TransactionFormData {
  id: string
  name: string
  amount: string
  category: string
  type: TransactionType
  date: Date
}

/**
 * API payload for creating a record
 */
export interface CreateRecordPayload {
  name: string
  amount: number
  category_id: string
  timestamp: number
}

/**
 * API payload for updating a record
 */
export interface UpdateRecordPayload {
  name?: string
  amount?: number
  category_id?: string
  timestamp?: number
}

/**
 * API response for records
 */
export interface RecordsResponse {
  records: ApiRecord[]
  total_count: number
}
