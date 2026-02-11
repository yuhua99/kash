import type { RecordItem } from '$lib/core/domain/models'
import { getRecords } from '$lib/features/records/api'

const RECORDS_CACHE_QUERY = {
  limit: 500,
  offset: 0,
} as const

let recordsCache: RecordItem[] | null = null
let recordsRequest: Promise<RecordItem[]> | null = null
let recordsCacheVersion = 0

async function fetchRecentRecordsFromApi(): Promise<RecordItem[]> {
  const response = await getRecords(RECORDS_CACHE_QUERY)
  return response.records
}

export function invalidateRecordsCache(): void {
  recordsCacheVersion += 1
  recordsCache = null
  recordsRequest = null
}

export async function getRecentRecordsCached(): Promise<RecordItem[]> {
  if (recordsCache) {
    return recordsCache
  }

  if (recordsRequest) {
    return recordsRequest
  }

  const requestVersion = recordsCacheVersion

  recordsRequest = fetchRecentRecordsFromApi()
    .then((records) => {
      if (requestVersion === recordsCacheVersion) {
        recordsCache = records
      }
      return records
    })
    .finally(() => {
      recordsRequest = null
    })

  return recordsRequest
}

export function filterRecordsByDateRange(
  records: RecordItem[],
  startDate: string,
  endDate: string,
): RecordItem[] {
  return records.filter((record) => {
    if (startDate && record.date < startDate) {
      return false
    }

    if (endDate && record.date > endDate) {
      return false
    }

    return true
  })
}
