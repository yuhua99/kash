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
  const records = computed(() => store.records)
  const transactions = computed(() => store.transactions)
  const isLoading = computed(() => store.isLoading)
  const error = computed(() => store.error)

  // Financial summaries
  const totalBalance = computed(() => store.totalBalance)
  const monthlyIncome = computed(() => store.monthlyIncome)
  const monthlyExpenses = computed(() => store.monthlyExpenses)
  const savingsRate = computed(() => store.savingsRate)

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
  const fetchRecords = (filters?: { start_time?: number; end_time?: number; limit?: number }) =>
    store.fetchRecords(filters)

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

    // State
    isLoading,
    error,

    // Financial summaries
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,

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
