<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { storeToRefs } from "pinia"
import { useAuthStore } from "@/stores/auth"
import { useRecordsStore } from "@/stores/records"
import { useCategoriesStore } from "@/stores/categories"
import { PeriodUnit } from "@/types"
import { useDashboardView } from "@/composables/dashboard/useDashboardView"
import { useMonthlyData } from "@/composables/dashboard/useMonthlyData"
import { usePeriodData } from "@/composables/dashboard/usePeriodData"
import { useAnalyticsData } from "@/composables/dashboard/useAnalyticsData"
import BalanceCard from "@/components/dashboard/BalanceCard.vue"
import QuickAddCard from "@/components/dashboard/QuickAddCard.vue"
import SavingsCard from "@/components/dashboard/SavingsCard.vue"
import TransactionsCard from "@/components/dashboard/TransactionsCard.vue"
import PeriodFilterCard from "@/components/dashboard/PeriodFilterCard.vue"
import AnalyticsCard from "@/components/dashboard/AnalyticsCard.vue"

const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()
const { latestTransactions } = storeToRefs(recordsStore)

const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH)

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

const { activeView, expandTransactions, backToOverview } = useDashboardView()
const { currentMonthSummary } = useMonthlyData(latestTransactions)
const { periodTransactions, financialSummary } = usePeriodData(latestTransactions, selectedPeriod)
const { filteredAnalytics } = useAnalyticsData(latestTransactions, periodTransactions, activeView)

const displayedTransactions = computed(() => {
  if (activeView.value === "transactions") {
    return periodTransactions.value
  }
  return latestTransactions.value.slice(0, 2)
})

const analyticsLabel = computed(() => {
  return activeView.value === "transactions" ? "Filtered Spending" : "Spending Trend"
})

const loadData = async () => {
  await categoriesStore.fetchCategories()
  await recordsStore.fetchLatestRecords()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen p-8 flex items-center justify-center">
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[16rem] gap-4 max-w-6xl w-full"
    >
      <BalanceCard
        v-if="activeView === 'overview'"
        :balance="currentMonthSummary.netIncome"
        currency="USD"
      />

      <QuickAddCard v-if="activeView === 'overview'" />

      <SavingsCard v-if="activeView === 'overview'" :savings-rate="financialSummary.savingsRate" />

      <TransactionsCard
        :transactions="displayedTransactions"
        :mode="activeView === 'transactions' ? 'expanded' : 'overview'"
        @expand="expandTransactions"
        @collapse="backToOverview"
      />

      <PeriodFilterCard
        v-if="activeView === 'transactions'"
        :selected-period="selectedPeriod"
        :summary="financialSummary"
        @update:selected-period="(value) => (selectedPeriod = value)"
      />

      <AnalyticsCard :data="filteredAnalytics" :label="analyticsLabel" />
    </div>
  </div>
</template>
