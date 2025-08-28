<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import StatsCards from '@/components/dashboard/StatsCards.vue'
import TrendDisplay from '@/components/dashboard/TrendDisplay.vue'
import SpendingByCategory from '@/components/dashboard/SpendingByCategory.vue'
import RecentTransactions from '@/components/transactions/RecentTransactions.vue'
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog.vue'
import CategoryManagement from '@/components/categories/CategoryManagement.vue'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTransactions } from '@/composables/useTransactions'
import { useCategories } from '@/composables/useCategories'
import type { TransactionBase } from '@/types'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()
const {
  sortedTransactions,
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  isLoading: transactionsLoading,
  error: transactionsError,
  fetchRecords,
  createRecord,
  clearError: clearTransactionsError,
} = useTransactions()

const {
  fetchCategories,
  isLoading: categoriesLoading,
  error: categoriesError,
  clearError: clearCategoriesError,
  getCategoryByName,
} = useCategories()

// Combined loading state
const isLoading = computed(
  () => authStore.isLoading || transactionsLoading.value || categoriesLoading.value,
)

// Functions
const addTransaction = async (newTransaction: TransactionBase) => {
  // Find the category by name
  const category = getCategoryByName(newTransaction.category)

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

  await createRecord(payload)
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
  await fetchCategories()
  await fetchRecords()
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
      v-if="authStore.error || transactionsError || categoriesError"
      class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
    >
      <p v-if="authStore.error">Authentication Error: {{ authStore.error }}</p>
      <p v-if="transactionsError">Records Error: {{ transactionsError }}</p>
      <p v-if="categoriesError">Categories Error: {{ categoriesError }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(authStore.clearError(), clearTransactionsError(), clearCategoriesError())"
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
      <!-- Dashboard Header -->
      <DashboardHeader />

      <!-- Dashboard Overview -->
      <div class="space-y-8">
        <!-- Summary Cards -->
        <StatsCards
          :total-balance="totalBalance"
          :monthly-income="monthlyIncome"
          :monthly-expenses="monthlyExpenses"
          :savings-rate="savingsRate"
        />

        <!-- Charts and Analysis -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div class="col-span-4">
            <TrendDisplay :monthly-income="monthlyIncome" :monthly-expenses="monthlyExpenses" />
          </div>
          <div class="col-span-3">
            <RecentTransactions :transactions="sortedTransactions" />
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div class="col-span-4">
            <SpendingByCategory :transactions="sortedTransactions" />
          </div>
          <div class="col-span-3">
            <CategoryManagement />
          </div>
        </div>
      </div>

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
