<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import StatsCards from '@/components/dashboard/StatsCards.vue'
import TrendDisplay from '@/components/dashboard/TrendDisplay.vue'
import SpendingByCategory from '@/components/dashboard/SpendingByCategory.vue'
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog.vue'
import FloatingButton from '@/components/common/FloatingButton.vue'
import { Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTransactions } from '@/composables/useTransactions'
import { useChartData } from '@/composables/useChartData'
import { useFinancialCalculations } from '@/composables/useFinancialCalculations'
import { useCategories } from '@/composables/useCategories'
import type { Transaction } from '@/types'
import { PeriodUnit } from '@/types'

// Router and stores
const authStore = useAuthStore()

// Period selection state
const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH)
const {
  sortedTransactions,
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
const addTransaction = async (newTransaction: Transaction) => {
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
    timestamp: newTransaction.timestamp,
  }

  await createRecord(payload)
}

// Load data function
const loadData = async () => {
  // Load categories first, then records (records need categories for display)
  await fetchCategories()
  await fetchRecords()
}

// Handle period change from DashboardHeader
const handlePeriodChange = (period: PeriodUnit) => {
  selectedPeriod.value = period
}

// Load data on component mount
onMounted(() => {
  loadData()
})

// Period-aware calculations for cards and category view
const { filterTransactionsByPeriod } = useChartData(sortedTransactions)
const periodTransactions = computed(() => filterTransactionsByPeriod(selectedPeriod.value))
const { financialSummary } = useFinancialCalculations(periodTransactions)

const periodIncome = computed(() => financialSummary.value.totalIncome)
const periodExpenses = computed(() => financialSummary.value.totalExpenses)
const periodSavingsRate = computed(() => financialSummary.value.savingsRate)
</script>

<template>
  <div class="space-y-8">
    <!-- Error State -->
    <div
      v-if="authStore.error || transactionsError || categoriesError"
      class="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded"
    >
      <p v-if="authStore.error">Authentication Error: {{ authStore.error }}</p>
      <p v-if="transactionsError">Records Error: {{ transactionsError }}</p>
      <p v-if="categoriesError">Categories Error: {{ categoriesError }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(authStore.clearError(), clearTransactionsError(), clearCategoriesError())"
          class="text-destructive underline text-sm"
        >
          Dismiss
        </button>
        <button @click="loadData" class="text-destructive underline text-sm">Retry</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-8">
      <!-- Dashboard Header Skeleton (title + single period select) -->
      <div class="flex items-center justify-between">
        <div>
          <Skeleton class="h-8 w-64" />
        </div>
        <div class="flex items-center gap-4">
          <Skeleton class="h-10 w-48" />
        </div>
      </div>

      <!-- Stats Cards Skeleton -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card v-for="i in 4" :key="i">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-8 w-24 mb-1" />
            <Skeleton class="h-3 w-32" />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <!-- Charts Grid Skeleton (Trend + Spending by Category) -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card class="lg:col-span-4">
          <CardHeader>
            <Skeleton class="h-6 w-40 mb-2" />
            <Skeleton class="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-64 w-full" />
          </CardContent>
        </Card>
        <Card class="lg:col-span-3">
          <CardHeader>
            <Skeleton class="h-6 w-56 mb-2" />
            <Skeleton class="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div v-for="i in 6" :key="i" class="flex items-center gap-3">
                <Skeleton class="h-3 w-24" />
                <Skeleton class="h-3 w-16 ml-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="authStore.isAuthenticated" class="space-y-8">
      <!-- Dashboard Header -->
      <DashboardHeader @period-change="handlePeriodChange" />

      <!-- Summary Cards -->
      <StatsCards
        :monthly-income="periodIncome"
        :monthly-expenses="periodExpenses"
        :savings-rate="periodSavingsRate"
      />

      <!-- Charts and Analysis -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <TrendDisplay
          class="lg:col-span-4"
          :transactions="sortedTransactions"
          :period="selectedPeriod"
        />
        <SpendingByCategory class="lg:col-span-3" :transactions="periodTransactions" />
      </div>

      <AddTransactionDialog @add-transaction="addTransaction">
        <FloatingButton aria-label="Add transaction">
          <Plus class="h-6 w-6" />
        </FloatingButton>
      </AddTransactionDialog>
    </div>
  </div>
</template>
