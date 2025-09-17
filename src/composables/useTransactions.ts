import { computed } from 'vue'
import { useRecordsStore } from '@/stores/records'
import type { Transaction, CreateRecordPayload, UpdateRecordPayload } from '@/types'
import { TransactionType } from '@/types'

/**
 * Transactions composable - provides a clean interface to transaction-related functionality
 */
export function useTransactions() {
  const store = useRecordsStore()

  // State
  const records = computed(() => store.latestRecords)
  const transactions = computed(() => store.latestTransactions)
  const totalTransactions = computed(() => store.latestTotalRecords)
  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  // Computed transaction lists
  const sortedTransactions = computed(() =>
    [...transactions.value].sort((a, b) => b.timestamp - a.timestamp),
  )

  const expenseTransactions = computed(() =>
    transactions.value.filter((t) => t.type === TransactionType.EXPENSE),
  )

  const incomeTransactions = computed(() =>
    transactions.value.filter((t) => t.type === TransactionType.INCOME),
  )

  const transactionCount = computed(() => transactions.value.length)

  // Methods
  const fetchRecords = () => store.fetchLatestRecords()

  const createRecord = (payload: CreateRecordPayload) => store.createRecord(payload)
  const updateRecord = (id: string, payload: UpdateRecordPayload) => store.updateRecord(id, payload)
  const deleteRecord = (id: string) => store.deleteRecord(id)
  const clearError = () => store.clearError()

  // Utility functions
  const getTransactionById = (id: string): Transaction | undefined =>
    transactions.value.find((t) => t.id === id)

  const getTransactionsByCategory = (category: string): Transaction[] =>
    transactions.value.filter((t) => t.category === category)

  const getTransactionsByTimestampRange = (
    startTimestamp: number,
    endTimestamp: number,
  ): Transaction[] =>
    transactions.value.filter((t) => t.timestamp >= startTimestamp && t.timestamp <= endTimestamp)

  return {
    // Raw data
    records,
    transactions,
    totalTransactions,

    // State
    isLoading,
    error,

    // Computed lists
    sortedTransactions,
    expenseTransactions,
    incomeTransactions,
    transactionCount,

    // Actions
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,

    // Utilities
    getTransactionById,
    getTransactionsByCategory,
    getTransactionsByTimestampRange,
  }
}
