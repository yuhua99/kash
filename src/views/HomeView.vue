<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import StatsCards from '@/components/StatsCards.vue'
import TrendDisplay from '@/components/TrendDisplay.vue'
import SpendingByCategory from '@/components/SpendingByCategory.vue'
import RecentTransactions from '@/components/RecentTransactions.vue'
import AddTransactionDialog from '@/components/AddTransactionDialog.vue'
import CategoryManagement from '@/components/CategoryManagement.vue'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'

import type { TransactionBase } from '@/components/TransactionForm.vue'

// Stores and router
const router = useRouter()
const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

// Computed values from stores
const totalBalance = computed(() => recordsStore.totalBalance)
const monthlyIncome = computed(() => recordsStore.monthlyIncome)
const monthlyExpenses = computed(() => recordsStore.monthlyExpenses)
const savingsRate = computed(() => recordsStore.savingsRate)

// Categories from store (for future use if needed)

// Loading state
const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

// All transactions sorted by date (most recent first)
const sortedTransactions = computed(() => {
  return [...recordsStore.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
})

// Functions
const addTransaction = async (newTransaction: TransactionBase) => {
  // Find the category ID for the given category name
  const category = categoriesStore.categories.find((cat) => cat.name === newTransaction.category)
  if (!category) {
    console.error('Category not found:', newTransaction.category)
    return
  }

  const payload = {
    name: newTransaction.name,
    amount: newTransaction.amount,
    category_id: category.id,
    timestamp: Math.floor(new Date(newTransaction.date).getTime() / 1000),
  }

  await recordsStore.createRecord(payload)
}

// Load data function
const loadData = async () => {
  // First check if we have a valid session
  const isAuthenticated = await authStore.checkAuthStatus()

  if (!isAuthenticated) {
    console.warn('User not authenticated, redirecting to login')
    router.push('/login')
    return
  }

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
  <div class="space-y-8">
    <!-- Error State -->
    <div
      v-if="authStore.error || recordsStore.error || categoriesStore.error"
      class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
    >
      <p v-if="authStore.error">Authentication Error: {{ authStore.error }}</p>
      <p v-if="recordsStore.error">Records Error: {{ recordsStore.error }}</p>
      <p v-if="categoriesStore.error">Categories Error: {{ categoriesStore.error }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(authStore.clearError(), recordsStore.clearError(), categoriesStore.clearError())"
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
    <div v-else-if="authStore.isAuthenticated" class="space-y-8">
      <!-- Dashboard Overview -->
      <div class="space-y-6">
        <!-- Summary Cards -->
        <StatsCards
          :total-balance="totalBalance"
          :monthly-income="monthlyIncome"
          :monthly-expenses="monthlyExpenses"
          :savings-rate="savingsRate"
        />

        <!-- Trend Display -->
        <TrendDisplay :monthly-income="monthlyIncome" :monthly-expenses="monthlyExpenses" />

        <!-- Spending Analysis -->
        <div class="grid gap-6 md:grid-cols-2">
          <SpendingByCategory :transactions="sortedTransactions" />
          <RecentTransactions :transactions="sortedTransactions" />
        </div>
      </div>

      <!-- Category Management -->
      <CategoryManagement />

      <!-- Quick Add Floating Button -->
      <AddTransactionDialog @add-transaction="addTransaction">
        <Button
          size="icon"
          class="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus class="h-6 w-6" />
        </Button>
      </AddTransactionDialog>
    </div>
  </div>
</template>
