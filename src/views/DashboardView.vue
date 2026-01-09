<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { storeToRefs } from "pinia"
import { useAuthStore } from "@/stores/auth"
import { useRecordsStore } from "@/stores/records"
import { useCategoriesStore } from "@/stores/categories"
import { useChartData } from "@/composables/useChartData"
import { useFinancialCalculations } from "@/composables/useFinancialCalculations"
import { formatCurrency, formatSignedCurrency } from "@/lib/formatters"
import { PeriodUnit } from "@/types"
import { Select } from "@/components/ui"
import DashboardCard from "@/components/DashboardCard.vue"

const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()
const { latestTransactions } = storeToRefs(recordsStore)

const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH)
const periodOptions = [
  { label: "Month", value: PeriodUnit.MONTH },
  { label: "Half year", value: PeriodUnit.HALF_YEAR },
  { label: "Year", value: PeriodUnit.YEAR },
]

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

const { filterTransactionsByPeriod, getTrendData } = useChartData(latestTransactions)
const periodTransactions = computed(() => filterTransactionsByPeriod(selectedPeriod.value))
const { categorySpending: periodCategorySpending } = useChartData(periodTransactions)
const { financialSummary } = useFinancialCalculations(periodTransactions)

const trendSeries = computed(() => getTrendData(selectedPeriod.value))
const netFlowSeries = computed(() => {
  const values = trendSeries.value.map((item) => item.income - item.expenses)
  const max = Math.max(0, ...values.map((value) => Math.abs(value)))

  return trendSeries.value.map((item, index) => {
    const value = values[index] ?? 0
    const width = max > 0 ? Math.round((Math.abs(value) / max) * 100) : 0
    return {
      label: item.period,
      value,
      width,
      positive: value >= 0,
    }
  })
})

const incomeExpenseBar = computed(() => {
  const income = financialSummary.value.totalIncome
  const expenses = financialSummary.value.totalExpenses
  const total = income + expenses
  const incomeWidth = total > 0 ? Math.round((income / total) * 100) : 0
  const expenseWidth = total > 0 ? Math.round((expenses / total) * 100) : 0
  return {
    income,
    expenses,
    incomeWidth,
    expenseWidth,
  }
})

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

const loadData = async () => {
  await categoriesStore.fetchCategories()
  await recordsStore.fetchLatestRecords()
}

onMounted(() => {
  loadData()
})

const currentMonthTransactions = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000)
  const endOfMonth = Math.floor(new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000)

  return latestTransactions.value.filter(
    (t) => t.timestamp >= startOfMonth && t.timestamp <= endOfMonth,
  )
})

const { financialSummary: currentMonthSummary } = useFinancialCalculations(currentMonthTransactions)

const last5MonthsExpenses = computed(() => {
  const { monthlyAnalysis } = useFinancialCalculations(latestTransactions)
  const analysis = monthlyAnalysis.value

  // Get last 5 months
  const last5 = analysis.slice(-5)

  // Calculate max expense for scaling
  const maxExpense = Math.max(...last5.map((m) => m.expenses), 1)

  const scaled = last5.map((m) => ({
    month: m.month,
    expenses: m.expenses,
    heightPercent: Math.round((m.expenses / maxExpense) * 100),
  }))

  // Always render 5 bars (use 10% placeholders)
  if (scaled.length >= 5) {
    return scaled
  }

  const placeholders = Array.from({ length: 5 - scaled.length }, (_, index) => ({
    month: `placeholder-${index}`,
    expenses: 0,
    heightPercent: 10,
  }))

  return [...placeholders, ...scaled]
})
</script>

<template>
  <div class="min-h-screen p-8 flex items-center justify-center">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl w-full">
      <DashboardCard>
        <div class="flex justify-between items-start">
          <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
            Balance
          </span>
          <span class="font-mono text-xs">USD</span>
        </div>
        <div>
          <h2 class="text-5xl font-bold tracking-tighter mb-2">
            {{ formatCurrency(currentMonthSummary.netIncome) }}
          </h2>
          <p class="font-mono text-xs text-[var(--text-muted)]">Current Month</p>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div class="flex justify-between items-start">
          <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
            Quick Add
          </span>
        </div>
        <div class="flex-1 flex flex-col justify-center relative mt-2">
          <input
            type="text"
            placeholder="124.50 groceries"
            class="w-full bg-transparent border-b border-black font-mono text-xl py-2 focus:outline-none placeholder-gray-400 transition-colors"
          />
          <button class="absolute right-0 bottom-4 text-2xl hover:text-gray-500 transition-colors">
            →
          </button>
        </div>
        <p class="font-mono text-xs text-[var(--text-muted)] mt-2">Format: amount category</p>
      </DashboardCard>

      <DashboardCard>
        <div class="flex justify-between items-start">
          <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
            Savings
          </span>
          <span class="font-mono text-xs">{{ Math.round(financialSummary.savingsRate) }}%</span>
        </div>
        <div class="w-full bg-gray-200 h-2 mt-auto">
          <div
            class="bg-current h-full"
            :style="{
              width: `${Math.max(0, Math.min(100, Math.round(financialSummary.savingsRate)))}%`,
            }"
          ></div>
        </div>
      </DashboardCard>

      <DashboardCard class="md:col-span-2">
        <div class="flex justify-between items-start mb-4">
          <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
            Latest Activity
          </span>
          <button class="font-mono text-xs underline" @click="$router.push('/transactions')">
            VIEW ALL
          </button>
        </div>

        <div v-if="latestTransactions.length > 0" class="space-y-4">
          <div
            v-for="transaction in latestTransactions.slice(0, 2)"
            :key="transaction.id"
            class="flex justify-between items-end border-b border-gray-200 pb-2"
          >
            <div>
              <div class="font-bold text-sm">{{ transaction.name }}</div>
              <div class="font-mono text-xs text-[var(--text-muted)]">
                {{ transaction.category }}
              </div>
            </div>
            <div class="font-mono text-sm">{{ formatSignedCurrency(transaction.amount) }}</div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-full">
          <p class="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
            No recent transactions
          </p>
        </div>
      </DashboardCard>

      <DashboardCard>
        <div class="flex justify-between items-start">
          <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
            Analytics
          </span>
        </div>

        <div class="flex items-end gap-2 h-24">
          <div
            v-for="(month, index) in last5MonthsExpenses"
            :key="month.month"
            class="flex-1 bg-current"
            :style="{ height: `${month.heightPercent || 10}%` }"
            :class="index < 4 ? 'opacity-50' : ''"
          ></div>

          <div v-if="last5MonthsExpenses.length === 0" class="flex w-full gap-2">
            <div
              v-for="index in 5"
              :key="index"
              class="flex-1 bg-current opacity-50"
              :style="{ height: '10%' }"
            ></div>
          </div>
        </div>

        <p class="font-mono text-xs text-center border-t border-black pt-2 mt-2">Spending Trend</p>
      </DashboardCard>
    </div>
  </div>
</template>
