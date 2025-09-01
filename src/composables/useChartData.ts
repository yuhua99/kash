import { computed, type Ref } from 'vue'
import type { Transaction } from '@/types'
import { TransactionType } from '@/types'

export interface ChartDataPoint {
  name: string
  value: number
}

export interface CategorySpendingData {
  category: string
  amount: number
  percentage: number
}

export interface TrendDataPoint {
  period: string
  income: number
  expenses: number
}

export interface SingleTrendDataPoint {
  period: string
  value: number
}

export type TrendPeriod = 'daily' | 'weekly' | 'monthly'

// Constants
const WEEKS_IN_HALF_YEAR = 26
const MONTHS_IN_YEAR = 12
const DAYS_PER_WEEK = 7

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
   * Monthly trend data for line charts
   */
  const monthlyTrendData = computed(() => {
    const monthlyData = new Map<string, { income: number; expenses: number }>()

    transactions.value.forEach((transaction) => {
      const monthKey = transaction.date.substring(0, 7) // YYYY-MM
      const current = monthlyData.get(monthKey) || { income: 0, expenses: 0 }

      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount
      } else {
        current.expenses += Math.abs(transaction.amount)
      }

      monthlyData.set(monthKey, current)
    })

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  })

  /**
   * Daily spending data for detailed analysis
   */
  const dailySpendingData = computed(() => {
    const dailyMap = new Map<string, number>()

    transactions.value
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((transaction) => {
        const current = dailyMap.get(transaction.date) || 0
        dailyMap.set(transaction.date, current + Math.abs(transaction.amount))
      })

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  })

  /**
   * Format currency values for charts
   */
  const currencyFormatter = (value: number | string): string => {
    if (value == null) return '$0'
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(numValue) ? '$0' : `$${numValue.toFixed(0)}`
  }

  /**
   * Format percentage values for charts
   */
  const percentageFormatter = (value: number): string => `${value.toFixed(1)}%`

  /**
   * Get date range based on dashboard period
   */
  const getDateRange = (period: string) => {
    const now = new Date()

    switch (period) {
      case 'this-month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { start, end }
      }
      case 'this-half-year': {
        const start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { start, end }
      }
      case 'this-year': {
        const start = new Date(now.getFullYear(), 0, 1)
        const end = new Date(now.getFullYear(), 11, 31)
        return { start, end }
      }
      default:
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31),
        }
    }
  }

  /**
   * Filter transactions by date range
   */
  const filterTransactionsByPeriod = (period: string) => {
    if (!transactions.value?.length) return []

    try {
      const { start, end } = getDateRange(period)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      return transactions.value.filter((t) => {
        // Handle invalid dates gracefully
        if (!t.date || typeof t.date !== 'string') return false
        return t.date >= startStr && t.date <= endStr
      })
    } catch (error) {
      console.warn('Error filtering transactions by period:', error)
      return []
    }
  }

  /**
   * Generate trend data for different periods
   */
  const getTrendData = (dashboardPeriod: string): TrendDataPoint[] => {
    const filteredTransactions = filterTransactionsByPeriod(dashboardPeriod)
    const trendPeriod: TrendPeriod =
      dashboardPeriod === 'this-month'
        ? 'daily'
        : dashboardPeriod === 'this-half-year'
          ? 'weekly'
          : 'monthly'

    if (trendPeriod === 'daily') {
      return getDailyTrendData(filteredTransactions)
    } else if (trendPeriod === 'weekly') {
      return getWeeklyTrendData(filteredTransactions)
    } else {
      return getMonthlyTrendData(filteredTransactions)
    }
  }

  /**
   * Generate daily trend data for current month
   */
  const getDailyTrendData = (transactions: Transaction[]): TrendDataPoint[] => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()

      const dailyMap = new Map<string, { income: number; expenses: number }>()

      // Initialize all days in month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        dailyMap.set(date, { income: 0, expenses: 0 })
      }

      // Aggregate transactions by day
      transactions.forEach((transaction) => {
        if (!transaction.date || !transaction.amount || !transaction.type) return

        const data = dailyMap.get(transaction.date)
        if (data) {
          if (transaction.type === TransactionType.INCOME) {
            data.income += transaction.amount
          } else {
            data.expenses += Math.abs(transaction.amount)
          }
        }
      })

      return Array.from(dailyMap.entries())
        .map(([date, data]) => {
          const dateObj = new Date(date)
          if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date found in daily trend data:', date)
            return null
          }

          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
          const day = dateObj.getDate().toString().padStart(2, '0')

          return {
            period: `${month}/${day}`,
            income: data.income,
            expenses: data.expenses,
          }
        })
        .filter((item): item is TrendDataPoint => item !== null)
        .sort((a, b) => a.period.localeCompare(b.period))
    } catch (error) {
      console.warn('Error generating daily trend data:', error)
      return []
    }
  }

  /**
   * Generate weekly trend data for last 26 weeks
   */
  const getWeeklyTrendData = (transactions: Transaction[]): TrendDataPoint[] => {
    try {
      const weeks: Array<{ label: string; start: string; end: string }> = []
      const today = new Date()

      // Generate last N weeks
      for (let i = WEEKS_IN_HALF_YEAR - 1; i >= 0; i--) {
        const weekStart = new Date(today)
        weekStart.setDate(weekStart.getDate() - i * DAYS_PER_WEEK - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + DAYS_PER_WEEK - 1)

        const weekStartMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0')
        const weekStartDay = weekStart.getDate().toString().padStart(2, '0')

        weeks.push({
          label: `${weekStartMonth}/${weekStartDay}`,
          start: weekStart.toISOString().split('T')[0],
          end: weekEnd.toISOString().split('T')[0],
        })
      }

      return weeks.map((week) => {
        const weekTransactions = transactions.filter(
          (t) => t.date && t.date >= week.start && t.date <= week.end,
        )

        const income = weekTransactions
          .filter((t) => t.type === TransactionType.INCOME && typeof t.amount === 'number')
          .reduce((sum, t) => sum + t.amount, 0)

        const expenses = weekTransactions
          .filter((t) => t.type === TransactionType.EXPENSE && typeof t.amount === 'number')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        return {
          period: week.label,
          income,
          expenses,
        }
      })
    } catch (error) {
      console.warn('Error generating weekly trend data:', error)
      return []
    }
  }

  /**
   * Generate monthly trend data for last 12 months
   */
  const getMonthlyTrendData = (transactions: Transaction[]): TrendDataPoint[] => {
    try {
      const monthlyMap = new Map<string, { income: number; expenses: number }>()
      const months: Array<{ key: string; label: string }> = []
      const today = new Date()

      // Generate current year months (January to December)
      for (let month = 0; month < MONTHS_IN_YEAR; month++) {
        const date = new Date(today.getFullYear(), month, 1)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })

        months.push({ key: monthKey, label: monthLabel })
        monthlyMap.set(monthKey, { income: 0, expenses: 0 })
      }

      // Aggregate transactions by month
      transactions.forEach((transaction) => {
        if (!transaction.date || typeof transaction.amount !== 'number' || !transaction.type) return

        const monthKey = transaction.date.substring(0, 7)
        const data = monthlyMap.get(monthKey)

        if (data) {
          if (transaction.type === TransactionType.INCOME) {
            data.income += transaction.amount
          } else {
            data.expenses += Math.abs(transaction.amount)
          }
        }
      })

      return months.map(({ key, label }) => {
        const data = monthlyMap.get(key) || { income: 0, expenses: 0 }
        return {
          period: label,
          income: data.income,
          expenses: data.expenses,
        }
      })
    } catch (error) {
      console.warn('Error generating monthly trend data:', error)
      return []
    }
  }

  /**
   * Memoized trend data cache
   */
  const trendDataCache = new Map<string, TrendDataPoint[]>()

  /**
   * Generate trend data for different periods with memoization
   */
  const getTrendDataMemoized = (dashboardPeriod: string): TrendDataPoint[] => {
    const cacheKey = `${dashboardPeriod}-${transactions.value.length}-${JSON.stringify(transactions.value.slice(0, 3))}`

    if (trendDataCache.has(cacheKey)) {
      return trendDataCache.get(cacheKey)!
    }

    const result = getTrendData(dashboardPeriod)
    trendDataCache.set(cacheKey, result)

    // Clear old cache entries to prevent memory leaks
    if (trendDataCache.size > 10) {
      const firstKey = trendDataCache.keys().next().value
      if (firstKey) {
        trendDataCache.delete(firstKey)
      }
    }

    return result
  }

  /**
   * Transform trend data for single data type charts
   */
  const getSingleTrendData = (
    dashboardPeriod: string,
    dataType: TransactionType,
  ): SingleTrendDataPoint[] => {
    const trendData = getTrendDataMemoized(dashboardPeriod)

    return trendData.map((item) => ({
      period: item.period,
      value: dataType === TransactionType.INCOME ? item.income : item.expenses,
    }))
  }

  return {
    // Processed data
    categorySpending,
    donutChartData,
    monthlyTrendData,
    dailySpendingData,

    // New trend data functions
    getTrendData,
    getSingleTrendData,

    // Formatters
    currencyFormatter,
    percentageFormatter,
  }
}
