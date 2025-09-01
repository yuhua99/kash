<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart } from '@/components/ui/chart-bar'
import type { Transaction } from '@/types'
import { TransactionType } from '@/types'
import { useChartData, type SingleTrendDataPoint } from '@/composables/useChartData'
import TrendTooltip from './TrendTooltip.vue'

interface Props {
  transactions: Transaction[]
  period: string
}

const props = defineProps<Props>()

const selectedDataType = ref<TransactionType>(TransactionType.EXPENSE)
const transactionsRef = toRef(props, 'transactions')
const { getSingleTrendData, currencyFormatter } = useChartData(transactionsRef)

// Get chart data using the composable with memoization
const chartData = computed(() => {
  return getSingleTrendData(props.period, selectedDataType.value)
})

// Chart configuration based on selected data type
const chartCategories = computed((): (keyof SingleTrendDataPoint)[] => ['value'])
const chartColors = computed(() => [
  selectedDataType.value === TransactionType.INCOME ? '#059669' : '#dc2626',
])
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle
          >{{ selectedDataType === TransactionType.INCOME ? 'Income' : 'Expense' }} Trend</CardTitle
        >
        <!-- Data Type Tabs -->
        <Tabs v-model="selectedDataType" class="w-auto">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger :value="TransactionType.INCOME">Income</TabsTrigger>
            <TabsTrigger :value="TransactionType.EXPENSE">Expenses</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </CardHeader>
    <CardContent class="p-4">
      <BarChart
        :data="chartData"
        index="period"
        :categories="chartCategories"
        :colors="chartColors"
        :show-legend="false"
        :y-formatter="(value: number | Date) => currencyFormatter(Number(value))"
        :custom-tooltip="TrendTooltip"
        :rounded-corners="4"
        class="h-80"
      />
    </CardContent>
  </Card>
</template>
