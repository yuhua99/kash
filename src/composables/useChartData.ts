import { computed, type Ref } from 'vue'
import type { Transaction } from '@/types'

export interface ChartDataPoint {
  name: string
  value: number
}

export interface CategorySpendingData {
  category: string
  amount: number
  percentage: number
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
    const expenses = transactions.value.filter((t) => t.type === 'expense')
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

      if (transaction.type === 'income') {
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
      .filter((t) => t.type === 'expense')
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
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(numValue) ? '$0' : `$${numValue.toFixed(0)}`
  }

  /**
   * Format percentage values for charts
   */
  const percentageFormatter = (value: number): string => `${value.toFixed(1)}%`

  return {
    // Processed data
    categorySpending,
    donutChartData,
    monthlyTrendData,
    dailySpendingData,

    // Formatters
    currencyFormatter,
    percentageFormatter,
  }
}
