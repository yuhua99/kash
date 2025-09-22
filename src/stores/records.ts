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
  const latestRecords = ref<ApiRecord[]>([])
  const latestTotalRecords = ref(0)
  const viewRecords = ref<ApiRecord[]>([])
  const viewTotalRecords = ref(0)
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

  const latestTransactions = computed<Transaction[]>(() => {
    return latestRecords.value.map(convertApiRecordToTransaction)
  })

  const viewTransactions = computed<Transaction[]>(() => {
    return viewRecords.value.map(convertApiRecordToTransaction)
  })

  // Aggregate summaries moved to view-level period calculations

  const runFetch = async (
    filters: {
      start_time?: number
      end_time?: number
      limit?: number
      offset?: number
    },
    targetRecords: typeof latestRecords,
    targetTotal: typeof latestTotalRecords,
  ): Promise<boolean> => {
    const params = new URLSearchParams()
    const limit = filters.limit ?? 500
    const offset = filters.offset ?? 0

    if (filters.start_time !== undefined) {
      params.append('start_time', filters.start_time.toString())
    }
    if (filters.end_time !== undefined) {
      params.append('end_time', filters.end_time.toString())
    }
    params.append('limit', limit.toString())
    if (offset > 0) {
      params.append('offset', offset.toString())
    }

    let endpoint = '/records'
    const query = params.toString()
    if (query) {
      endpoint += `?${query}`
    }

    const data = await executeRequest(() => api.get<RecordsResponse>(endpoint), {
      onSuccess: (response) => {
        targetRecords.value = response.records
        targetTotal.value = response.total_count ?? response.records.length
      },
      onError: () => {
        targetTotal.value = 0
      },
    })

    if (data === null) {
      return false
    }

    return true
  }

  const fetchLatestRecords = async (): Promise<boolean> => {
    const { start, end } = getRangeForPeriod(PeriodUnit.YEAR)
    return runFetch(
      {
        start_time: start,
        end_time: end,
        limit: 500,
        offset: 0,
      },
      latestRecords,
      latestTotalRecords,
    )
  }

  const fetchRecordsForPeriod = async (filters: {
    start_time: number
    end_time: number
    limit?: number
    offset?: number
  }): Promise<boolean> => {
    return runFetch(filters, viewRecords, viewTotalRecords)
  }

  const createRecord = async (payload: CreateRecordPayload): Promise<ApiRecord | null> => {
    const data = await executeRequest(() => api.post<ApiRecord>('/records', payload), {
      onSuccess: (newRecord) => {
        latestRecords.value.unshift(newRecord) // Add to beginning for chronological order
        latestTotalRecords.value += 1
        viewRecords.value.unshift(newRecord)
        viewTotalRecords.value += 1
      },
    })

    return data
  }

  const updateRecord = async (
    id: string,
    payload: UpdateRecordPayload,
  ): Promise<ApiRecord | null> => {
    const data = await executeRequest(() => api.put<ApiRecord>(`/records/${id}`, payload), {
      onSuccess: (updatedRecord) => {
        const index = latestRecords.value.findIndex((record) => record.id === id)
        if (index !== -1) {
          latestRecords.value[index] = updatedRecord
        }
        const viewIndex = viewRecords.value.findIndex((record) => record.id === id)
        if (viewIndex !== -1) {
          viewRecords.value.splice(viewIndex, 1, updatedRecord)
        }
      },
    })

    return data
  }

  const deleteRecord = async (id: string): Promise<boolean> => {
    const success = await executeRequest(() => api.delete<void>(`/records/${id}`), {
      onSuccess: () => {
        latestRecords.value = latestRecords.value.filter((record) => record.id !== id)
        latestTotalRecords.value = Math.max(0, latestTotalRecords.value - 1)
        const beforeLength = viewRecords.value.length
        viewRecords.value = viewRecords.value.filter((record) => record.id !== id)
        if (viewRecords.value.length !== beforeLength) {
          viewTotalRecords.value = Math.max(0, viewTotalRecords.value - 1)
        }
      },
    })

    return success !== null
  }

  return {
    latestRecords,
    latestTransactions,
    latestTotalRecords,
    viewRecords,
    viewTransactions,
    viewTotalRecords,
    isLoading,
    error,
    fetchLatestRecords,
    fetchRecordsForPeriod,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  }
})
