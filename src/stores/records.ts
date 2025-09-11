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
import { TransactionType } from '@/types'

export const useRecordsStore = defineStore('records', () => {
  const records = ref<ApiRecord[]>([])
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
  }): Promise<boolean> => {
    let endpoint = '/records'
    const params = new URLSearchParams()

    if (filters?.start_time) params.append('start_time', filters.start_time.toString())
    if (filters?.end_time) params.append('end_time', filters.end_time.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    const data = await executeRequest(() => api.get<RecordsResponse>(endpoint), {
      onSuccess: (response) => {
        records.value = response.records
      },
    })

    return !!data
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
    isLoading,
    error,
    fetchRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  }
})
