import type { RecordItem } from '$lib/core/domain/models'
import { getRecords } from '$lib/features/records/api'

const RECORDS_QUERY_PAGE_SIZE = 1000

type RecordsDateRangeQuery = {
  startDate: string
  endDate: string
}

export async function getAllRecordsByDateRange({
  startDate,
  endDate,
}: RecordsDateRangeQuery): Promise<RecordItem[]> {
  const records: RecordItem[] = []
  let offset = 0

  while (true) {
    const response = await getRecords({
      start_date: startDate,
      end_date: endDate,
      limit: RECORDS_QUERY_PAGE_SIZE,
      offset,
    })

    records.push(...response.records)

    if (records.length >= response.total_count || response.records.length === 0) {
      return records
    }

    offset += response.records.length
  }
}
