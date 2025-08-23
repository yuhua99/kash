<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DashboardHeader from '@/components/DashboardHeader.vue'
import StatsCards from '@/components/StatsCards.vue'
import TransactionsTable from '@/components/TransactionsTable.vue'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'

// Enhanced transaction interface
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

// Stores
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

// Filter states
const selectedCategory = ref<string>('all')
const searchQuery = ref('')

// Computed values from stores
const totalBalance = computed(() => recordsStore.totalBalance)
const monthlyIncome = computed(() => recordsStore.monthlyIncome)
const monthlyExpenses = computed(() => recordsStore.monthlyExpenses)
const savingsRate = computed(() => recordsStore.savingsRate)

// Categories from store (for future use if needed)

// Loading state
const isLoading = computed(() => recordsStore.isLoading || categoriesStore.isLoading)

// Filtered transactions
const filteredTransactions = computed(() => {
  return recordsStore.transactions
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
const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
  // Find the category ID for the given category name
  const category = categoriesStore.categories.find((cat) => cat.name === newTransaction.category)
  if (!category) {
    console.error('Category not found:', newTransaction.category)
    return
  }

  const payload = {
    name: newTransaction.description,
    amount: newTransaction.amount,
    category_id: category.id,
  }

  await recordsStore.createRecord(payload)
}

const deleteTransaction = async (id: string) => {
  await recordsStore.deleteRecord(id)
}

// Load data function
const loadData = async () => {
  // Load categories first, then records (records need categories for display)
  await categoriesStore.fetchCategories()
  await recordsStore.fetchRecords()
}

// Load data on component mount
onMounted(() => {
  loadData()
})
</script>

<template>
  <main class="p-6 space-y-8">
    <!-- Error State -->
    <div
      v-if="recordsStore.error || categoriesStore.error"
      class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
    >
      <p v-if="recordsStore.error">Records Error: {{ recordsStore.error }}</p>
      <p v-if="categoriesStore.error">Categories Error: {{ categoriesStore.error }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(recordsStore.clearError(), categoriesStore.clearError())"
          class="text-red-700 underline text-sm"
        >
          Dismiss
        </button>
        <button @click="loadData" class="text-red-700 underline text-sm">Retry</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-8">
      <!-- Dashboard Header Skeleton -->
      <div class="flex items-center justify-between">
        <div>
          <Skeleton class="h-8 w-64 mb-2" />
          <Skeleton class="h-4 w-48" />
        </div>
        <div class="flex items-center gap-4">
          <Skeleton class="h-10 w-64" />
          <Skeleton class="h-10 w-48" />
          <Skeleton class="h-10 w-40" />
        </div>
      </div>

      <!-- Stats Cards Skeleton -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="i in 4" :key="i">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-8 w-20 mb-1" />
            <Skeleton class="h-3 w-32" />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <!-- Transactions Table Skeleton -->
      <Card>
        <CardHeader>
          <Skeleton class="h-6 w-32 mb-2" />
          <Skeleton class="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="i in 5" :key="i" class="flex items-center space-x-4">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-40" />
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-4 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content -->
    <div v-else>
      <DashboardHeader
        v-model:search-query="searchQuery"
        v-model:selected-category="selectedCategory"
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
    </div>
  </main>
</template>
