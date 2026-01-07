<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRecordsStore } from "@/stores/records";
import { useCategoriesStore } from "@/stores/categories";
import { useChartData } from "@/composables/useChartData";
import { useFinancialCalculations } from "@/composables/useFinancialCalculations";
import { formatSignedCurrency } from "@/lib/formatters";
import { PeriodUnit } from "@/types";

const authStore = useAuthStore();
const recordsStore = useRecordsStore();
const categoriesStore = useCategoriesStore();

const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH);
const periodOptions = [
  { label: "Month", value: PeriodUnit.MONTH },
  { label: "Half year", value: PeriodUnit.HALF_YEAR },
  { label: "Year", value: PeriodUnit.YEAR },
];

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
);

const { filterTransactionsByPeriod, getTrendData } = useChartData(recordsStore.latestTransactions);
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
</script>

<template>
  <section class="space-y-8">
    <header class="space-y-4 border-b border-black pb-6">
      <div class="flex items-start justify-between gap-6">
        <div>
          <div class="text-xs uppercase tracking-widest">Analytics</div>
          <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Dashboard</h1>
          <p class="mt-2 text-sm text-black/70">Period focus, visual summaries, zero CRUD.</p>
        </div>
        <div class="min-w-[180px]">
          <label class="text-xs uppercase tracking-widest">Period</label>
          <select v-model="selectedPeriod" class="mt-2 w-full border border-black px-3 py-2">
            <option v-for="period in periodOptions" :key="period.value" :value="period.value">
              {{ period.label }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <div v-if="authStore.error || recordsStore.error || categoriesStore.error" class="space-y-2">
      <div class="border border-black px-4 py-3 text-xs">
        <div v-if="authStore.error">Auth: {{ authStore.error }}</div>
        <div v-if="recordsStore.error">Records: {{ recordsStore.error }}</div>
        <div v-if="categoriesStore.error">Categories: {{ categoriesStore.error }}</div>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="border border-black p-4">
        <div class="text-xs uppercase tracking-widest">Net flow trend</div>
        <div class="mt-4 space-y-2">
          <div
            v-for="point in netFlowSeries"
            :key="point.label"
            class="flex items-center gap-3 text-xs"
          >
            <div class="w-16 shrink-0 text-[10px] uppercase tracking-widest text-black/70">
              {{ point.label }}
            </div>
            <div class="h-2 flex-1 border border-black">
              <div
                class="h-full bg-black"
                :style="{ width: `${point.width}%` }"
                :class="point.positive ? '' : 'opacity-50'"
              ></div>
            </div>
            <div class="w-20 text-right">{{ formatSignedCurrency(point.value) }}</div>
          </div>
          <div v-if="!netFlowSeries.length" class="text-xs uppercase tracking-widest">No data.</div>
        </div>
      </div>

      <div class="border border-black p-4">
        <div class="text-xs uppercase tracking-widest">Income vs Expense</div>
        <div class="mt-4 space-y-4 text-xs">
          <div class="h-4 w-full border border-black">
            <div class="flex h-full">
              <div
                class="h-full border-r border-black"
                :style="{ width: `${incomeExpenseBar.incomeWidth}%` }"
              ></div>
              <div
                class="h-full bg-black"
                :style="{ width: `${incomeExpenseBar.expenseWidth}%` }"
              ></div>
            </div>
          </div>
          <div class="flex items-center justify-between uppercase tracking-widest">
            <span>Income</span>
            <span>{{ formatSignedCurrency(incomeExpenseBar.income) }}</span>
          </div>
          <div class="flex items-center justify-between uppercase tracking-widest">
            <span>Expense</span>
            <span>{{ formatSignedCurrency(-incomeExpenseBar.expenses) }}</span>
          </div>
        </div>
      </div>

      <div class="border border-black p-4">
        <div class="text-xs uppercase tracking-widest">Category spend</div>
        <div class="mt-4 space-y-3 text-xs">
          <div v-for="item in topCategories" :key="item.category" class="space-y-1">
            <div class="flex items-center justify-between uppercase tracking-widest">
              <span>{{ item.category }}</span>
              <span>{{ formatSignedCurrency(-item.amount) }}</span>
            </div>
            <div class="h-2 border border-black">
              <div class="h-full bg-black" :style="{ width: `${item.width}%` }"></div>
            </div>
          </div>
          <div v-if="!topCategories.length" class="text-xs uppercase tracking-widest">
            No category data.
          </div>
        </div>
      </div>

      <div class="border border-black p-4">
        <div class="text-xs uppercase tracking-widest">Savings rate</div>
        <div class="mt-4 space-y-4 text-xs">
          <div class="h-4 border border-black">
            <div
              class="h-full bg-black"
              :style="{
                width: `${Math.max(0, Math.min(100, Math.round(financialSummary.savingsRate)))}%`,
              }"
            ></div>
          </div>
          <div class="flex items-center justify-between uppercase tracking-widest">
            <span>Rate</span>
            <span>{{ Math.round(financialSummary.savingsRate) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="border border-black p-4">
      <div class="text-xs uppercase tracking-widest">Quick facts</div>
      <div class="mt-4 grid gap-4 md:grid-cols-4 text-xs">
        <div class="border border-black p-3">
          <div class="text-[10px] uppercase tracking-widest text-black/70">Net</div>
          <div class="mt-2 text-sm font-semibold">
            {{ formatSignedCurrency(financialSummary.netIncome) }}
          </div>
        </div>
        <div class="border border-black p-3">
          <div class="text-[10px] uppercase tracking-widest text-black/70">Income</div>
          <div class="mt-2 text-sm font-semibold">
            {{ formatSignedCurrency(financialSummary.totalIncome) }}
          </div>
        </div>
        <div class="border border-black p-3">
          <div class="text-[10px] uppercase tracking-widest text-black/70">Expenses</div>
          <div class="mt-2 text-sm font-semibold">
            {{ formatSignedCurrency(-financialSummary.totalExpenses) }}
          </div>
        </div>
        <div class="border border-black p-3">
          <div class="text-[10px] uppercase tracking-widest text-black/70">Largest</div>
          <div v-if="largestTransaction" class="mt-2 text-sm font-semibold">
            {{ largestTransaction.name }}
          </div>
          <div
            v-if="largestTransaction"
            class="text-[10px] uppercase tracking-widest text-black/70"
          >
            {{ formatSignedCurrency(largestTransaction.amount) }}
          </div>
          <div v-else class="mt-2 text-sm font-semibold">None</div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-xs uppercase tracking-widest">Loading analytics...</div>
  </section>
</template>
