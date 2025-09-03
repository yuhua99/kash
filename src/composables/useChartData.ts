import { computed, type Ref } from 'vue'
import type { Transaction } from '@/types'
import { TransactionType, DashboardPeriod } from '@/types'

// Internal types
type ChartDataPoint = { name: string; value: number }
type CategorySpendingData = { category: string; amount: number; percentage: number }
type TrendDataPoint = { period: string; income: number; expenses: number }

// Constants
const WEEKS_IN_HALF_YEAR = 26
const MONTHS_IN_YEAR = 12
const DAYS_PER_WEEK = 7
const SEC_PER_DAY = 86400

// Date utilities
const formatMonthDay = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${month}/${day}`
}
const formatMonthLabel = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('en-US', { month: 'short' })
}
const startOfDay = (timestamp: number): number => {
  const d = new Date(timestamp * 1000)
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}
const startOfWeekSunday = (timestamp: number): number => {
  const d = new Date(timestamp * 1000)
  const day = d.getDay() // Sunday=0
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}
const startOfMonth = (timestamp: number): number => {
  const d = new Date(timestamp * 1000)
  const m = new Date(d.getFullYear(), d.getMonth(), 1)
  return Math.floor(m.getTime() / 1000)
}

/**
 * Chart data composable - transforms transaction data into chart-ready formats
 */
export function useChartData(transactions: Ref<Transaction[]>) {
  /**
   * Calculate spending by category for expenses only
   */
  const categorySpending = computed((): CategorySpendingData[] => {
    const categoryMap = new Map<string, number>()

    // Only count expenses for category breakdown
    const expenses = transactions.value.filter((t) => t.type === TransactionType.EXPENSE)
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    expenses.forEach((transaction) => {
      const current = categoryMap.get(transaction.category) || 0
      categoryMap.set(transaction.category, current + Math.abs(transaction.amount))
    })

    return Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  })

  /**
   * Chart data for donut/pie charts
   */
  const donutChartData = computed((): ChartDataPoint[] => {
    return categorySpending.value.map((item) => ({
      name: item.category,
      value: item.amount,
    }))
  })

  /**
   * Get timestamp range based on dashboard period
   */
  const getTimestampRange = (period: DashboardPeriod) => {
    const now = new Date()

    switch (period) {
      case DashboardPeriod.THIS_MONTH: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) }
      }
      case DashboardPeriod.THIS_HALF_YEAR: {
        const start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) }
      }
      case DashboardPeriod.THIS_YEAR: {
        const start = new Date(now.getFullYear(), 0, 1)
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        return { start: Math.floor(start.getTime() / 1000), end: Math.floor(end.getTime() / 1000) }
      }
      default:
        return {
          start: Math.floor(new Date(now.getFullYear(), 0, 1).getTime() / 1000),
          end: Math.floor(new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime() / 1000),
        }
    }
  }

  /**
   * Filter transactions by timestamp range
   */
  const filterTransactionsByPeriod = (period: DashboardPeriod) => {
    if (!transactions.value?.length) return []

    const { start, end } = getTimestampRange(period)

    return transactions.value.filter((t) => {
      if (!t.timestamp || typeof t.timestamp !== 'number') return false
      return t.timestamp >= start && t.timestamp <= end
    })
  }

  /**
   * Build buckets for the given period
   */
  const buildBuckets = (
    dashboardPeriod: DashboardPeriod,
  ): Array<{ start: number; end: number; label: string; key: number }> => {
    const now = new Date()

    if (dashboardPeriod === DashboardPeriod.THIS_MONTH) {
      const year = now.getFullYear()
      const month = now.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const buckets: Array<{ start: number; end: number; label: string; key: number }> = []
      for (let day = 1; day <= daysInMonth; day++) {
        const start = Math.floor(new Date(year, month, day).getTime() / 1000)
        const end = start + SEC_PER_DAY - 1
        buckets.push({ start, end, label: formatMonthDay(start), key: start })
      }
      return buckets
    }

    if (dashboardPeriod === DashboardPeriod.THIS_HALF_YEAR) {
      const buckets: Array<{ start: number; end: number; label: string; key: number }> = []
      const todayTs = Math.floor(now.getTime() / 1000)
      const startOfThisWeek = startOfWeekSunday(todayTs)
      for (let i = WEEKS_IN_HALF_YEAR - 1; i >= 0; i--) {
        const start = startOfThisWeek - i * DAYS_PER_WEEK * SEC_PER_DAY
        const end = start + DAYS_PER_WEEK * SEC_PER_DAY - 1
        buckets.push({ start, end, label: formatMonthDay(start), key: start })
      }
      return buckets
    }

    // THIS_YEAR
    const buckets: Array<{ start: number; end: number; label: string; key: number }> = []
    const year = now.getFullYear()
    for (let m = 0; m < MONTHS_IN_YEAR; m++) {
      const startDate = new Date(year, m, 1)
      const nextMonth = new Date(year, m + 1, 1)
      const start = Math.floor(startDate.getTime() / 1000)
      const end = Math.floor(nextMonth.getTime() / 1000) - 1
      buckets.push({ start, end, label: formatMonthLabel(start), key: start })
    }
    return buckets
  }

  /**
   * Aggregate transactions into buckets efficiently
   */
  const aggregateIntoBuckets = (
    txs: Transaction[],
    dashboardPeriod: DashboardPeriod,
  ): TrendDataPoint[] => {
    const buckets = buildBuckets(dashboardPeriod)
    const indexByKey = new Map<number, number>(buckets.map((b, i) => [b.key, i]))
    const totals = buckets.map(() => ({ income: 0, expenses: 0 }))

    for (const t of txs) {
      if (!t.timestamp || typeof t.amount !== 'number' || !t.type) continue

      let key: number
      if (dashboardPeriod === DashboardPeriod.THIS_MONTH) {
        key = startOfDay(t.timestamp)
      } else if (dashboardPeriod === DashboardPeriod.THIS_HALF_YEAR) {
        key = startOfWeekSunday(t.timestamp)
      } else {
        key = startOfMonth(t.timestamp)
      }

      const idx = indexByKey.get(key)
      if (idx === undefined) continue

      if (t.type === TransactionType.INCOME) {
        totals[idx].income += t.amount
      } else if (t.type === TransactionType.EXPENSE) {
        totals[idx].expenses += Math.abs(t.amount)
      }
    }

    return buckets.map((b, i) => ({
      period: b.label,
      income: totals[i].income,
      expenses: totals[i].expenses,
    }))
  }

  /**
   * Generate trend data (both income and expenses)
   */
  const getTrendData = (dashboardPeriod: DashboardPeriod): TrendDataPoint[] => {
    const filtered = filterTransactionsByPeriod(dashboardPeriod)
    return aggregateIntoBuckets(filtered, dashboardPeriod)
  }

  /**
   * Transform trend data for a single TransactionType using enums
   */
  const getSingleTrendData = (dashboardPeriod: DashboardPeriod, dataType: TransactionType) => {
    const trend = getTrendData(dashboardPeriod)
    return trend.map((item) => ({
      period: item.period,
      value: dataType === TransactionType.INCOME ? item.income : item.expenses,
    }))
  }

  return {
    // Processed data
    categorySpending,
    donutChartData,

    // Trend data functions
    getTrendData,
    getSingleTrendData,

    // Utilities
    filterTransactionsByPeriod,
  }
}
