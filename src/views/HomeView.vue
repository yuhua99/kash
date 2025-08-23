<script setup lang="ts">
import { ref, computed } from 'vue'
import { Separator } from '@/components/ui/separator'
import DashboardHeader from '@/components/DashboardHeader.vue'
import StatsCards from '@/components/StatsCards.vue'
import TransactionsTable from '@/components/TransactionsTable.vue'

// Enhanced transaction interface
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

// Sample data with more realistic transactions
const transactions = ref<Transaction[]>([
  {
    id: '1',
    date: '2025-08-22',
    description: 'Grocery Store',
    amount: -85.32,
    category: 'Food',
    type: 'expense',
  },
  {
    id: '2',
    date: '2025-08-20',
    description: 'Salary Deposit',
    amount: 3500.0,
    category: 'Income',
    type: 'income',
  },
  {
    id: '3',
    date: '2025-08-19',
    description: 'Electric Bill',
    amount: -127.45,
    category: 'Utilities',
    type: 'expense',
  },
  {
    id: '4',
    date: '2025-08-18',
    description: 'Coffee Shop',
    amount: -12.5,
    category: 'Food',
    type: 'expense',
  },
  {
    id: '5',
    date: '2025-08-17',
    description: 'Gas Station',
    amount: -45.0,
    category: 'Transportation',
    type: 'expense',
  },
  {
    id: '6',
    date: '2025-08-16',
    description: 'Freelance Work',
    amount: 750.0,
    category: 'Income',
    type: 'income',
  },
  {
    id: '7',
    date: '2025-08-15',
    description: 'Restaurant',
    amount: -65.8,
    category: 'Food',
    type: 'expense',
  },
  {
    id: '8',
    date: '2025-08-14',
    description: 'Internet Bill',
    amount: -89.99,
    category: 'Utilities',
    type: 'expense',
  },
])

// Filter states
const selectedCategory = ref<string>('all')
const searchQuery = ref('')

// Categories
const categories = [
  'Food',
  'Utilities',
  'Transportation',
  'Income',
  'Entertainment',
  'Healthcare',
  'Shopping',
]

// Computed values
const totalBalance = computed(() => {
  return transactions.value.reduce((sum, t) => sum + t.amount, 0)
})

const monthlyIncome = computed(() => {
  return transactions.value.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
})

const monthlyExpenses = computed(() => {
  return Math.abs(
    transactions.value.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
  )
})

const savingsRate = computed(() => {
  return monthlyIncome.value > 0
    ? ((monthlyIncome.value - monthlyExpenses.value) / monthlyIncome.value) * 100
    : 0
})

// Filtered transactions
const filteredTransactions = computed(() => {
  return transactions.value
    .filter((transaction) => {
      const matchesCategory =
        selectedCategory.value === 'all' || transaction.category === selectedCategory.value
      const matchesSearch =
        !searchQuery.value ||
        transaction.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Functions
const addTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
  transactions.value.push({
    id: Date.now().toString(),
    ...newTransaction,
  })
}

const deleteTransaction = (id: string) => {
  transactions.value = transactions.value.filter((t) => t.id !== id)
}
</script>

<template>
  <main class="p-6 space-y-8">
    <DashboardHeader
      v-model:search-query="searchQuery"
      v-model:selected-category="selectedCategory"
      :categories="categories"
      @add-transaction="addTransaction"
    />
    <StatsCards
      :total-balance="totalBalance"
      :monthly-income="monthlyIncome"
      :monthly-expenses="monthlyExpenses"
      :savings-rate="savingsRate"
    />
    <Separator />
    <TransactionsTable
      :transactions="filteredTransactions"
      @delete-transaction="deleteTransaction"
    />
  </main>
</template>
