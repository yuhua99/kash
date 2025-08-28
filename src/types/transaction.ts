/**
 * Transaction-related types
 */

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
 * Frontend transaction representation
 */
export interface Transaction {
  id: string
  date: string
  name: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

/**
 * Form data for transaction input
 */
export interface TransactionFormData {
  name: string
  amount: string
  category: string
  type: 'income' | 'expense'
  date: string
}

/**
 * Base transaction data (without ID)
 */
export interface TransactionBase {
  name: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
}

/**
 * Transaction with ID (for editing)
 */
export interface TransactionWithId extends TransactionBase {
  id: string
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
