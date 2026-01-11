import { computed, type Ref } from "vue"
import type { Transaction, PeriodUnit } from "@/types"
import { useFinancialCalculations } from "@/composables/useFinancialCalculations"

export interface MonthExpenseData {
  month: string
  expenses: number
  heightPercent: number
}

export function useAnalyticsData(
  allTransactions: Ref<Transaction[]>,
  periodTransactions: Ref<Transaction[]>,
  activeView: Ref<"overview" | "transactions">,
) {
  const last5MonthsExpenses = computed(() => {
    const { monthlyAnalysis } = useFinancialCalculations(allTransactions)
    const analysis = monthlyAnalysis.value

    const now = new Date()
    const monthKeys = Array.from({ length: 5 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`
    })

    const expensesByMonth = new Map(analysis.map((item) => [item.month, item.expenses]))
    const normalized = monthKeys.map((month) => ({
      month,
      expenses: expensesByMonth.get(month) ?? 0,
    }))

    const maxExpense = Math.max(...normalized.map((m) => m.expenses), 1)

    return normalized.map((m) => ({
      month: m.month,
      expenses: m.expenses,
      heightPercent: Math.round((m.expenses / maxExpense) * 100),
    }))
  })

  const filteredAnalytics = computed(() => {
    if (activeView.value !== "transactions") {
      return last5MonthsExpenses.value
    }

    const { monthlyAnalysis } = useFinancialCalculations(periodTransactions)
    const analysis = monthlyAnalysis.value

    const last5 = analysis.slice(-5)
    const maxExpense = Math.max(...last5.map((m) => m.expenses), 1)

    return last5.map((m) => ({
      month: m.month,
      expenses: m.expenses,
      heightPercent: Math.round((m.expenses / maxExpense) * 100),
    }))
  })

  return {
    last5MonthsExpenses,
    filteredAnalytics,
  }
}
