import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/lib/api'
import { useApiRequest } from '@/composables/useApiRequest'
import { useCategoriesStore } from './categories'
import { formatDate } from '@/lib/formatters'
import type {
  ApiRecord,
  Transaction,
  CreateRecordPayload,
  UpdateRecordPayload,
  RecordsResponse,
} from '@/types'
import { TransactionType, PeriodUnit } from '@/types'
import { getRangeForPeriod } from '@/lib/timeRange'

export const useRecordsStore = defineStore('records', () => {
  const records = ref<ApiRecord[]>([])
  const totalRecords = ref(0)
  const { isLoading, error, clearError, executeRequest } = useApiRequest()

  const categoriesStore = useCategoriesStore()

  const convertApiRecordToTransaction = (record: ApiRecord): Transaction => {
    const categoryName = categoriesStore.getCategoryName(record.category_id)

    return {
      id: record.id,
      timestamp: record.timestamp,
      timeStr: formatDate(record.timestamp),
      name: record.name,
      amount: record.amount,
      category_id: record.category_id,
      category: categoryName,
      type: record.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
    }
  }

  const transactions = computed<Transaction[]>(() => {
    return records.value.map(convertApiRecordToTransaction)
  })

  // Aggregate summaries moved to view-level period calculations

  const fetchRecords = async (filters?: {
    start_time?: number
    end_time?: number
    limit?: number
    offset?: number
  }): Promise<boolean> => {
    let endpoint = '/records'
    // Default to YEAR when no filters provided
    if (!filters) {
      const { start, end } = getRangeForPeriod(PeriodUnit.YEAR)
      filters = { start_time: start, end_time: end }
    }

    const { start_time, end_time, limit = 500, offset = 0 } = filters
    const params = new URLSearchParams()

    if (start_time) params.append('start_time', start_time.toString())
    if (end_time) params.append('end_time', end_time.toString())
    params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    const data = await executeRequest(() => api.get<RecordsResponse>(endpoint), {
      onSuccess: (response) => {
        records.value = response.records
        totalRecords.value = response.total_count ?? response.records.length
      },
      onError: () => {
        totalRecords.value = 0
      },
    })

    if (data === null) {
      return false
    }

    return true
  }

  const createRecord = async (payload: CreateRecordPayload): Promise<ApiRecord | null> => {
    const data = await executeRequest(() => api.post<ApiRecord>('/records', payload), {
      onSuccess: (newRecord) => {
        records.value.unshift(newRecord) // Add to beginning for chronological order
      },
    })

    return data
  }

  const updateRecord = async (id: string, payload: UpdateRecordPayload): Promise<boolean> => {
    const data = await executeRequest(() => api.put<ApiRecord>(`/records/${id}`, payload), {
      onSuccess: (updatedRecord) => {
        const index = records.value.findIndex((record) => record.id === id)
        if (index !== -1) {
          records.value[index] = updatedRecord
        }
      },
    })

    return !!data
  }

  const deleteRecord = async (id: string): Promise<boolean> => {
    const success = await executeRequest(() => api.delete<void>(`/records/${id}`), {
      onSuccess: () => {
        records.value = records.value.filter((record) => record.id !== id)
      },
    })

    return success !== null
  }

  return {
    records,
    transactions,
    totalRecords,
    isLoading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  }
})
