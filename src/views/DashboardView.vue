<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

  const created = await createRecord(payload)
  if (!created) {
    console.error('Failed to create transaction from dashboard')
  }
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

    <div v-if="authStore.isAuthenticated" class="space-y-8">
      <!-- Dashboard Header -->
      <DashboardHeader :loading="isLoading" @period-change="handlePeriodChange" />

      <!-- Summary Cards -->
      <StatsCards
        :loading="isLoading"
        :monthly-income="periodIncome"
        :monthly-expenses="periodExpenses"
        :savings-rate="periodSavingsRate"
      />

      <!-- Charts and Analysis -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-7">
        <TrendDisplay
          class="lg:col-span-4"
          :loading="isLoading"
          :transactions="sortedTransactions"
          :period="selectedPeriod"
        />
        <SpendingByCategory
          class="lg:col-span-3"
          :loading="isLoading"
          :transactions="periodTransactions"
        />
      </div>

      <AddTransactionDialog v-if="!isLoading" @add-transaction="addTransaction">
        <FloatingButton aria-label="Add transaction">
          <Plus class="h-6 w-6" />
        </FloatingButton>
      </AddTransactionDialog>
    </div>
  </div>
</template>
