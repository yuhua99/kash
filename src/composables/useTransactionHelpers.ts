import { useRecordsStore } from '@/stores/records'

export function useTransactionHelpers() {
  const recordsStore = useRecordsStore()

  const suggestName = (amount: string, category: string): string[] => {
    if (!amount || !category || isNaN(parseFloat(amount))) return []

    const targetAmount = parseFloat(amount)
    const existingTransactions = recordsStore.transactions

    // Filter to recent transactions (last 6 months)
    const sixMonthsAgo = Math.floor(Date.now() / 1000) - 6 * 30 * 24 * 60 * 60
    const recentTransactions = existingTransactions.filter(
      (transaction) => transaction.timestamp > sixMonthsAgo,
    )

    const sameCategoryTransactions = recentTransactions.filter(
      (transaction) => transaction.category === category,
    )

    // Sort by amount difference (smallest difference first)
    const sortedBySimilarity = sameCategoryTransactions
      .sort((a, b) => {
        const diffA = Math.abs(a.amount - targetAmount)
        const diffB = Math.abs(b.amount - targetAmount)
        return diffA - diffB
      })
      .slice(0, 50) // Early exit

    const suggestions = [
      ...new Set(sortedBySimilarity.map((transaction) => transaction.name)),
    ].slice(0, 5)

    return suggestions
  }

  return {
    suggestName,
  }
}
