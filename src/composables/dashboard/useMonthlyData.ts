import { computed, type Ref } from "vue"
import type { Transaction } from "@/types"
import { useFinancialCalculations } from "@/composables/useFinancialCalculations"

export function useMonthlyData(transactions: Ref<Transaction[]>) {
  const currentMonthTransactions = computed(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const startOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000)
    const endOfMonth = Math.floor(new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000)

    return transactions.value.filter(
      (t) => t.timestamp >= startOfMonth && t.timestamp <= endOfMonth,
    )
  })

  const { financialSummary: currentMonthSummary } =
    useFinancialCalculations(currentMonthTransactions)

  return {
    currentMonthTransactions,
    currentMonthSummary,
  }
}
