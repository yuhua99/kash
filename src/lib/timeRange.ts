import { PeriodUnit, type Range } from '@/types'

export function getRangeForPeriod(period: PeriodUnit): Range {
  const now = new Date()

  let startDate = new Date(now.getFullYear(), 0, 1)
  let endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)

  switch (period) {
    case PeriodUnit.MONTH: {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      break
    }
    case PeriodUnit.HALF_YEAR: {
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      break
    }
    case PeriodUnit.YEAR: {
      // Already set by default above
      break
    }
  }

  const nowTs = Math.floor(now.getTime() / 1000)
  const endTs = Math.floor(endDate.getTime() / 1000)

  return {
    start: Math.floor(startDate.getTime() / 1000),
    end: Math.min(nowTs, endTs),
  }
}
