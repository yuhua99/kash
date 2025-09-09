import { useRecordsStore } from '@/stores/records'

export function useTransactionHelpers() {
  const recordsStore = useRecordsStore()

  const suggestName = (amount: string, category: string): string[] => {
    if (!amount || !category) return []

    const targetAmount = parseFloat(amount)
    const existingTransactions = recordsStore.transactions

    // Filter transactions with same category
    const sameCategoryTransactions = existingTransactions.filter(
      (transaction) => transaction.category === category,
    )

    // Sort by amount difference (smallest difference first)
    const sortedBySimilarity = sameCategoryTransactions.sort((a, b) => {
      const diffA = Math.abs(a.amount - targetAmount)
      const diffB = Math.abs(b.amount - targetAmount)
      return diffA - diffB
    })

    // Extract unique descriptions
    const suggestions = sortedBySimilarity
      .map((transaction) => transaction.name)
      .filter((name, index, array) => array.indexOf(name) === index) // Remove duplicates
      .slice(0, 5) // Limit to top 5 suggestions

    return suggestions
  }

  return {
    suggestName,
  }
}
