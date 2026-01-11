import { computed, type Ref } from "vue"
import type { Transaction, PeriodUnit } from "@/types"
import { useChartData } from "@/composables/useChartData"
import { useFinancialCalculations } from "@/composables/useFinancialCalculations"

export function usePeriodData(transactions: Ref<Transaction[]>, period: Ref<PeriodUnit>) {
  const { filterTransactionsByPeriod } = useChartData(transactions)

  const periodTransactions = computed(() => filterTransactionsByPeriod(period.value))

  const { categorySpending: periodCategorySpending } = useChartData(periodTransactions)
  const { financialSummary } = useFinancialCalculations(periodTransactions)

  const topCategories = computed(() => {
    const max = Math.max(0, ...periodCategorySpending.value.map((item) => item.amount))
    return periodCategorySpending.value.slice(0, 4).map((item) => ({
      ...item,
      width: max > 0 ? Math.round((item.amount / max) * 100) : 0,
    }))
  })

  const largestTransaction = computed(() => {
    if (!periodTransactions.value.length) {
      return null
    }
    const sorted = [...periodTransactions.value].sort(
      (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
    )
    return sorted[0]
  })

  return {
    periodTransactions,
    financialSummary,
    topCategories,
    largestTransaction,
  }
}
