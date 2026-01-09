<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth";
import { useRecordsStore } from "@/stores/records";
import { useCategoriesStore } from "@/stores/categories";
import { useChartData } from "@/composables/useChartData";
import { useFinancialCalculations } from "@/composables/useFinancialCalculations";
import { formatCurrency, formatSignedCurrency } from "@/lib/formatters";
import { PeriodUnit } from "@/types";
import { Select } from "@/components/ui";
import Block from "@/components/Block.vue";

// ==================== VIEW STATE MANAGEMENT ====================
type ViewMode = "overview" | "transactions";
const activeView = ref<ViewMode>("overview");

function expandTransactions() {
  activeView.value = "transactions";
}

function backToOverview() {
  activeView.value = "overview";
}

// ==================== STORES & DATA LOADING ====================
const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const categoriesStore = useCategoriesStore();
const { latestTransactions } = storeToRefs(recordsStore);

const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH);
const periodOptions = [
  { label: "Month", value: PeriodUnit.MONTH },
  { label: "Half year", value: PeriodUnit.HALF_YEAR },
  { label: "Year", value: PeriodUnit.YEAR },
];

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
);

const { filterTransactionsByPeriod, getTrendData } = useChartData(latestTransactions);
const periodTransactions = computed(() => filterTransactionsByPeriod(selectedPeriod.value));
const { categorySpending: periodCategorySpending } = useChartData(periodTransactions);
const { financialSummary } = useFinancialCalculations(periodTransactions);

const trendSeries = computed(() => getTrendData(selectedPeriod.value));
const netFlowSeries = computed(() => {
  const values = trendSeries.value.map((item) => item.income - item.expenses);
  const max = Math.max(0, ...values.map((value) => Math.abs(value)));

  return trendSeries.value.map((item, index) => {
    const value = values[index] ?? 0;
    const width = max > 0 ? Math.round((Math.abs(value) / max) * 100) : 0;
    return {
      label: item.period,
      value,
      width,
      positive: value >= 0,
    };
  });
});

const incomeExpenseBar = computed(() => {
  const income = financialSummary.value.totalIncome;
  const expenses = financialSummary.value.totalExpenses;
  const total = income + expenses;
  const incomeWidth = total > 0 ? Math.round((income / total) * 100) : 0;
  const expenseWidth = total > 0 ? Math.round((expenses / total) * 100) : 0;
  return {
    income,
    expenses,
    incomeWidth,
    expenseWidth,
  };
});

const topCategories = computed(() => {
  const max = Math.max(0, ...periodCategorySpending.value.map((item) => item.amount));
  return periodCategorySpending.value.slice(0, 4).map((item) => ({
    ...item,
    width: max > 0 ? Math.round((item.amount / max) * 100) : 0,
  }));
});

const largestTransaction = computed(() => {
  if (!periodTransactions.value.length) {
    return null;
  }
  const sorted = [...periodTransactions.value].sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
  );
  return sorted[0];
});

const loadData = async () => {
  await categoriesStore.fetchCategories();
  await recordsStore.fetchLatestRecords();
};

onMounted(() => {
  loadData();
});

// ==================== CURRENT MONTH CALCULATIONS ====================
const currentMonthTransactions = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000);
  const endOfMonth = Math.floor(new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000);

  return latestTransactions.value.filter(
    (t) => t.timestamp >= startOfMonth && t.timestamp <= endOfMonth,
  );
});

const { financialSummary: currentMonthSummary } =
  useFinancialCalculations(currentMonthTransactions);

// ==================== ANALYTICS DATA ====================
const last5MonthsExpenses = computed(() => {
  const { monthlyAnalysis } = useFinancialCalculations(latestTransactions);
  const analysis = monthlyAnalysis.value;

  const now = new Date();
  const monthKeys = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  });

  const expensesByMonth = new Map(analysis.map((item) => [item.month, item.expenses]));
  const normalized = monthKeys.map((month) => ({
    month,
    expenses: expensesByMonth.get(month) ?? 0,
  }));

  const maxExpense = Math.max(...normalized.map((m) => m.expenses), 1);

  return normalized.map((m) => ({
    month: m.month,
    expenses: m.expenses,
    heightPercent: Math.round((m.expenses / maxExpense) * 100),
  }));
});

// ==================== TRANSACTION VIEW FILTERING ====================
// When in transaction view, use the selected period filter
const displayedTransactions = computed(() => {
  if (activeView.value === "transactions") {
    return periodTransactions.value;
  }
  // In overview, just show latest 2
  return latestTransactions.value.slice(0, 2);
});

// Analytics data for transaction view (based on filtered transactions)
const filteredAnalytics = computed(() => {
  if (activeView.value !== "transactions") {
    return last5MonthsExpenses.value;
  }

  // Recalculate based on periodTransactions
  const { monthlyAnalysis } = useFinancialCalculations(periodTransactions);
  const analysis = monthlyAnalysis.value;

  const last5 = analysis.slice(-5);
  const maxExpense = Math.max(...last5.map((m) => m.expenses), 1);

  return last5.map((m) => ({
    month: m.month,
    expenses: m.expenses,
    heightPercent: Math.round((m.expenses / maxExpense) * 100),
  }));
});
</script>

<template>
  <div class="min-h-screen p-8 flex items-center justify-center">
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[16rem] gap-4 max-w-6xl w-full"
    >
      <!-- OVERVIEW MODE BLOCKS (Row 1) -->
      <!-- Balance Block (only in overview) -->
      <Transition name="fade">
        <Block
          v-if="activeView === 'overview'"
          class="lg:col-start-1 lg:row-start-1"
          label="Balance"
        >
          <template #headerRight>
            <span class="font-mono text-xs">USD</span>
          </template>
          <div class="flex-1 flex flex-col justify-end overflow-hidden">
            <h2 class="text-5xl font-bold tracking-tighter mb-2">
              {{ formatCurrency(currentMonthSummary.netIncome) }}
            </h2>
            <p class="font-mono text-xs text-[var(--text-muted)]">Current Month</p>
          </div>
        </Block>
      </Transition>

      <!-- Quick Add Block (only in overview) -->
      <Transition name="fade">
        <Block
          v-if="activeView === 'overview'"
          class="lg:col-start-2 lg:row-start-1"
          label="Quick Add"
        >
          <div class="flex-1 flex flex-col justify-center relative overflow-hidden">
            <input
              type="text"
              placeholder="124.50 groceries"
              class="w-full bg-transparent border-b border-black font-mono text-xl py-2 focus:outline-none placeholder-gray-400 transition-colors"
            />
            <button
              class="absolute right-0 bottom-2 text-2xl hover:text-gray-500 transition-colors"
            >
              →
            </button>
          </div>
          <p class="font-mono text-xs text-[var(--text-muted)] shrink-0">Format: amount category</p>
        </Block>
      </Transition>

      <!-- Savings Block (only in overview) -->
      <Transition name="fade">
        <Block
          v-if="activeView === 'overview'"
          class="lg:col-start-3 lg:row-start-1"
          label="Savings"
        >
          <template #headerRight>
            <span class="font-mono text-xs">{{ Math.round(financialSummary.savingsRate) }}%</span>
          </template>
          <div class="flex-1 flex flex-col justify-end overflow-hidden">
            <div class="w-full bg-gray-200 h-2">
              <div
                class="bg-current h-full transition-all duration-300"
                :style="{
                  width: `${Math.max(0, Math.min(100, Math.round(financialSummary.savingsRate)))}%`,
                }"
              ></div>
            </div>
          </div>
        </Block>
      </Transition>

      <!-- TRANSACTIONS BLOCK (Row 2 in overview, grows upward to span Row 1+2 in expanded) -->
      <div
        class="bg-white border border-black flex flex-col p-8 md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:row-end-3 transition-all duration-500 ease-in-out"
        :class="{
          'h-64 lg:translate-y-[17rem]': activeView === 'overview',
          'h-[33rem] lg:translate-y-0': activeView === 'transactions',
        }"
      >
        <div class="flex justify-between items-start mb-4 shrink-0">
          <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
            Latest Activity
          </span>
          <button
            v-if="activeView === 'overview'"
            class="font-mono text-xs underline hover:text-gray-600 transition-colors"
            @click="expandTransactions"
          >
            VIEW ALL
          </button>
          <button
            v-else
            class="font-mono text-xs underline hover:text-gray-600 transition-colors"
            @click="backToOverview"
          >
            BACK
          </button>
        </div>

        <div v-if="latestTransactions.length > 0" class="flex-1 overflow-y-auto space-y-3 min-h-0">
          <div
            v-for="transaction in displayedTransactions"
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
        <div v-else class="flex-1 flex items-center justify-center min-h-0">
          <p class="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
            No recent transactions
          </p>
        </div>
      </div>

      <!-- PERIOD FILTER BLOCK (only in transaction view, upper right) -->
      <Transition name="fade">
        <Block
          v-if="activeView === 'transactions'"
          class="lg:col-start-3 lg:row-start-1"
          label="Time Period"
        >
          <div class="flex-1 flex flex-col justify-center overflow-hidden">
            <Select v-model="selectedPeriod" :options="periodOptions" class="w-full mb-4" />
            <div class="space-y-2">
              <div class="flex justify-between font-mono text-xs">
                <span>Income:</span>
                <span class="text-green-600">{{
                  formatCurrency(financialSummary.totalIncome)
                }}</span>
              </div>
              <div class="flex justify-between font-mono text-xs">
                <span>Expenses:</span>
                <span class="text-red-600">{{
                  formatCurrency(financialSummary.totalExpenses)
                }}</span>
              </div>
              <div
                class="flex justify-between font-mono text-sm font-bold border-t border-black pt-2"
              >
                <span>Net:</span>
                <span>{{ formatCurrency(financialSummary.netIncome) }}</span>
              </div>
            </div>
          </div>
        </Block>
      </Transition>

      <!-- ANALYTICS BLOCK (always present, lower right) -->
      <Block class="lg:col-start-3 lg:row-start-2" label="Analytics">
        <div class="flex-1 flex flex-col justify-end overflow-hidden">
          <div class="flex items-end gap-2 h-32">
            <div
              v-for="(month, index) in filteredAnalytics"
              :key="month.month"
              class="flex-1 bg-current transition-all duration-300"
              :style="{ height: `${month.heightPercent || 10}%` }"
              :class="index < filteredAnalytics.length - 1 ? 'opacity-50' : ''"
            ></div>
          </div>
          <p class="font-mono text-xs text-center border-t border-black pt-2 mt-3 shrink-0">
            {{ activeView === "transactions" ? "Filtered Spending" : "Spending Trend" }}
          </p>
        </div>
      </Block>
    </div>
  </div>
</template>

<style scoped>
/* Fade transition for appearing/disappearing blocks */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
