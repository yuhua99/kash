import { computed, type Ref } from 'vue'
import type { Transaction } from '@/types'
import { TransactionType, DashboardPeriod } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/formatters'

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

export enum TrendPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// Constants
const WEEKS_IN_HALF_YEAR = 26
const MONTHS_IN_YEAR = 12
const DAYS_PER_WEEK = 7

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
const getStartOfDay = (timestamp: number): number => {
  const date = new Date(timestamp * 1000)
  date.setHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
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
   * Format currency values for charts
   */
  const currencyFormatter = (value: number): string => formatCurrency(value)

  /**
   * Format percentage values for charts
   */
  const percentageFormatter = (value: number): string => formatPercent(value)

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
   * Generate trend data for different periods
   */
  const getTrendData = (dashboardPeriod: DashboardPeriod): TrendDataPoint[] => {
    const filteredTransactions = filterTransactionsByPeriod(dashboardPeriod)
    const trendPeriod: TrendPeriod =
      dashboardPeriod === DashboardPeriod.THIS_MONTH
        ? TrendPeriod.DAILY
        : dashboardPeriod === DashboardPeriod.THIS_HALF_YEAR
          ? TrendPeriod.WEEKLY
          : TrendPeriod.MONTHLY

    if (trendPeriod === TrendPeriod.DAILY) {
      return getDailyTrendData(filteredTransactions)
    } else if (trendPeriod === TrendPeriod.WEEKLY) {
      return getWeeklyTrendData(filteredTransactions)
    } else {
      return getMonthlyTrendData(filteredTransactions)
    }
  }

  /**
   * Generate daily trend data for current month
   */
  const getDailyTrendData = (transactions: Transaction[]): TrendDataPoint[] => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const dailyMap = new Map<number, { income: number; expenses: number }>()

    // Initialize all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = Math.floor(new Date(year, month, day).getTime() / 1000)
      dailyMap.set(dayStart, { income: 0, expenses: 0 })
    }

    // Aggregate transactions by day
    transactions.forEach((transaction) => {
      if (!transaction.timestamp || typeof transaction.amount !== 'number' || !transaction.type)
        return

      const dayStart = getStartOfDay(transaction.timestamp)
      const data = dailyMap.get(dayStart)
      if (data) {
        if (transaction.type === TransactionType.INCOME) {
          data.income += transaction.amount
        } else {
          data.expenses += Math.abs(transaction.amount)
        }
      }
    })

    return Array.from(dailyMap.entries()).map(([timestamp, data]) => ({
      period: formatMonthDay(timestamp),
      income: data.income,
      expenses: data.expenses,
    }))
  }

  /**
   * Generate weekly trend data for last 26 weeks
   */
  const getWeeklyTrendData = (transactions: Transaction[]): TrendDataPoint[] => {
    const weeks: Array<{ label: string; start: number; end: number }> = []
    const today = new Date()

    // Generate last N weeks
    for (let i = WEEKS_IN_HALF_YEAR - 1; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - i * DAYS_PER_WEEK - today.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + DAYS_PER_WEEK - 1)
      weekEnd.setHours(23, 59, 59, 999)

      const startTimestamp = Math.floor(weekStart.getTime() / 1000)
      const endTimestamp = Math.floor(weekEnd.getTime() / 1000)

      weeks.push({
        label: formatMonthDay(startTimestamp),
        start: startTimestamp,
        end: endTimestamp,
      })
    }

    return weeks.map((week) => {
      const weekTransactions = transactions.filter(
        (t) => t.timestamp && t.timestamp >= week.start && t.timestamp <= week.end,
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
  }

  /**
   * Generate monthly trend data for last 12 months
   */
  const getMonthlyTrendData = (transactions: Transaction[]): TrendDataPoint[] => {
    const monthlyMap = new Map<number, { income: number; expenses: number }>()
    const months: Array<{ timestamp: number; label: string }> = []
    const today = new Date()

    // Generate current year months (January to December)
    for (let month = 0; month < MONTHS_IN_YEAR; month++) {
      const monthStart = new Date(today.getFullYear(), month, 1)
      const monthTimestamp = Math.floor(monthStart.getTime() / 1000)
      const monthLabel = formatMonthLabel(monthTimestamp)

      months.push({ timestamp: monthTimestamp, label: monthLabel })
      monthlyMap.set(monthTimestamp, { income: 0, expenses: 0 })
    }

    // Aggregate transactions by month
    transactions.forEach((transaction) => {
      if (!transaction.timestamp || typeof transaction.amount !== 'number' || !transaction.type)
        return

      // Get month start timestamp for grouping
      const transactionDate = new Date(transaction.timestamp * 1000)
      const monthStart = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1)
      const monthTimestamp = Math.floor(monthStart.getTime() / 1000)
      const data = monthlyMap.get(monthTimestamp)

      if (data) {
        if (transaction.type === TransactionType.INCOME) {
          data.income += transaction.amount
        } else {
          data.expenses += Math.abs(transaction.amount)
        }
      }
    })

    return months.map(({ timestamp, label }) => {
      const data = monthlyMap.get(timestamp) || { income: 0, expenses: 0 }
      return {
        period: label,
        income: data.income,
        expenses: data.expenses,
      }
    })
  }

  /**
   * Transform trend data for single data type charts
   */
  const getSingleTrendData = (
    dashboardPeriod: DashboardPeriod,
    dataType: TransactionType,
  ): SingleTrendDataPoint[] => {
    const trendData = getTrendData(dashboardPeriod)

    return trendData.map((item) => ({
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

    // Formatters
    currencyFormatter,
    percentageFormatter,

    // Utilities
    filterTransactionsByPeriod,
  }
}
