import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, type ApiResponse } from '@/lib/api'
import { useCategoriesStore } from './categories'

interface ApiRecord {
  id: string
  name: string
  amount: number
  category_id: string
  timestamp: number
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

interface CreateRecordPayload {
  name: string
  amount: number
  category_id: string
  timestamp: number
}

interface UpdateRecordPayload {
  name?: string
  amount?: number
  category_id?: string
  timestamp?: number
}

interface RecordsResponse {
  records: ApiRecord[]
  total_count: number
}

export const useRecordsStore = defineStore('records', () => {
  const records = ref<ApiRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const categoriesStore = useCategoriesStore()

  const convertApiRecordToTransaction = (record: ApiRecord): Transaction => {
    const categoryName = categoriesStore.getCategoryName(record.category_id)
    const date = new Date(record.timestamp * 1000).toISOString().split('T')[0]

    return {
      id: record.id,
      date,
      description: record.name,
      amount: record.amount,
      category: categoryName,
      type: record.amount >= 0 ? 'income' : 'expense',
    }
  }

  const transactions = computed<Transaction[]>(() => {
    return records.value.map(convertApiRecordToTransaction)
  })

  const totalBalance = computed(() => {
    return records.value.reduce((sum, record) => sum + record.amount, 0)
  })

  const monthlyIncome = computed(() => {
    return records.value
      .filter((record) => record.amount > 0)
      .reduce((sum, record) => sum + record.amount, 0)
  })

  const monthlyExpenses = computed(() => {
    return Math.abs(
      records.value
        .filter((record) => record.amount < 0)
        .reduce((sum, record) => sum + record.amount, 0),
    )
  })

  const savingsRate = computed(() => {
    return monthlyIncome.value > 0
      ? ((monthlyIncome.value - monthlyExpenses.value) / monthlyIncome.value) * 100
      : 0
  })

  const fetchRecords = async (filters?: {
    start_time?: number
    end_time?: number
    limit?: number
  }): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      let endpoint = '/records'
      const params = new URLSearchParams()

      if (filters?.start_time) params.append('start_time', filters.start_time.toString())
      if (filters?.end_time) params.append('end_time', filters.end_time.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      if (params.toString()) {
        endpoint += `?${params.toString()}`
      }

      const response: ApiResponse<RecordsResponse> = await api.get(endpoint)

      if (response.success && response.data) {
        records.value = response.data.records
        return true
      } else {
        error.value = response.error || 'Failed to fetch records'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const createRecord = async (payload: CreateRecordPayload): Promise<ApiRecord | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<ApiRecord> = await api.post('/records', payload)

      if (response.success && response.data) {
        records.value.unshift(response.data) // Add to beginning for chronological order
        return response.data
      } else {
        error.value = response.error || 'Failed to create record'
        return null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updateRecord = async (id: string, payload: UpdateRecordPayload): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<ApiRecord> = await api.put(`/records/${id}`, payload)

      if (response.success && response.data) {
        const index = records.value.findIndex((record) => record.id === id)
        if (index !== -1) {
          records.value[index] = response.data
        }
        return true
      } else {
        error.value = response.error || 'Failed to update record'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const deleteRecord = async (id: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response: ApiResponse<void> = await api.delete(`/records/${id}`)

      if (response.success) {
        records.value = records.value.filter((record) => record.id !== id)
        return true
      } else {
        error.value = response.error || 'Failed to delete record'
        return false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Network error occurred'
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    records,
    transactions,
    isLoading,
    error,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  }
})
