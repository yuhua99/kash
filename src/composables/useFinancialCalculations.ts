import { computed, type Ref } from 'vue'
import type { Transaction } from '@/types'
import { TransactionType } from '@/types'

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netIncome: number
  savingsRate: number
  transactionCount: number
  averageExpense: number
  largestExpense: number
  largestIncome: number
}

export interface CategoryBreakdown {
  category: string
  totalSpent: number
  transactionCount: number
  averageTransaction: number
  percentage: number
}

/**
 * Financial calculations composable - provides advanced financial analysis
 */
export function useFinancialCalculations(transactions: Ref<Transaction[]>) {
  /**
   * Basic financial summary
   */
  const financialSummary = computed((): FinancialSummary => {
    const income = transactions.value.filter((t) => t.type === TransactionType.INCOME)
    const expenses = transactions.value.filter((t) => t.type === TransactionType.EXPENSE)

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const netIncome = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0

    const expenseAmounts = expenses.map((t) => Math.abs(t.amount))
    const incomeAmounts = income.map((t) => t.amount)

    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      transactionCount: transactions.value.length,
      averageExpense:
        expenseAmounts.length > 0
          ? expenseAmounts.reduce((a, b) => a + b, 0) / expenseAmounts.length
          : 0,
      largestExpense: expenseAmounts.length > 0 ? Math.max(...expenseAmounts) : 0,
      largestIncome: incomeAmounts.length > 0 ? Math.max(...incomeAmounts) : 0,
    }
  })

  /**
   * Category breakdown analysis
   */
  const categoryBreakdown = computed((): CategoryBreakdown[] => {
    const categoryMap = new Map<string, Transaction[]>()

    // Group expenses by category
    transactions.value
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((transaction) => {
        const existing = categoryMap.get(transaction.category) || []
        categoryMap.set(transaction.category, [...existing, transaction])
      })

    const totalExpenses = financialSummary.value.totalExpenses

    return Array.from(categoryMap.entries())
      .map(([category, categoryTransactions]) => {
        const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
        return {
          category,
          totalSpent,
          transactionCount: categoryTransactions.length,
          averageTransaction: totalSpent / categoryTransactions.length,
          percentage: totalExpenses > 0 ? (totalSpent / totalExpenses) * 100 : 0,
        }
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
  })

  /**
   * Monthly analysis
   */
  const monthlyAnalysis = computed(() => {
    const monthlyMap = new Map<string, { income: number; expenses: number; transactions: number }>()

    transactions.value.forEach((transaction) => {
      const monthKey = transaction.date.substring(0, 7) // YYYY-MM
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0, transactions: 0 }

      current.transactions++
      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount
      } else {
        current.expenses += Math.abs(transaction.amount)
      }

      monthlyMap.set(monthKey, current)
    })

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
        transactions: data.transactions,
        savingsRate: data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  })

  /**
   * Budget health indicators
   */
  const budgetHealth = computed(() => {
    const summary = financialSummary.value

    return {
      isHealthy: summary.savingsRate >= 20, // 20% savings rate considered healthy
      savingsRateCategory:
        summary.savingsRate >= 30
          ? 'excellent'
          : summary.savingsRate >= 20
            ? 'good'
            : summary.savingsRate >= 10
              ? 'fair'
              : 'poor',
      expenseToIncomeRatio:
        summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) * 100 : 0,
      recommendations: getRecommendations(summary),
    }
  })

  /**
   * Get financial recommendations based on current data
   */
  function getRecommendations(summary: FinancialSummary): string[] {
    const recommendations: string[] = []

    if (summary.savingsRate < 10) {
      recommendations.push('Consider reducing expenses to increase your savings rate')
    }

    if (summary.savingsRate < 0) {
      recommendations.push('You are spending more than you earn - create a budget plan')
    }

    if (summary.savingsRate > 30) {
      recommendations.push('Great savings rate! Consider investment opportunities')
    }

    return recommendations
  }

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  /**
   * Format percentage for display
   */
  const formatPercentage = (percentage: number): string => `${percentage.toFixed(1)}%`

  return {
    // Calculations
    financialSummary,
    categoryBreakdown,
    monthlyAnalysis,
    budgetHealth,

    // Utilities
    formatCurrency,
    formatPercentage,
  }
}
