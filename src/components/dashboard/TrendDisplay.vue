<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart } from '@/components/ui/chart-bar'
import type { Transaction } from '@/types'
import { TransactionType, PeriodUnit } from '@/types'
import { useChartData } from '@/composables/useChartData'

interface Props {
  transactions: Transaction[]
  period: PeriodUnit
}

const props = defineProps<Props>()

const selectedDataType = ref<TransactionType>(TransactionType.EXPENSE)
const transactionsRef = toRef(props, 'transactions')
const { getSingleTrendData } = useChartData(transactionsRef)

// Get chart data using the composable with memoization
const chartData = computed(() => {
  return getSingleTrendData(props.period, selectedDataType.value)
})

// Chart configuration based on selected data type
const chartColors = computed(() => [
  // Use themed colors instead of hardcoded hex
  selectedDataType.value === TransactionType.INCOME
    ? 'hsl(var(--vis-secondary-color))'
    : 'hsl(var(--vis-primary-color))',
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
        :categories="['value']"
        :colors="chartColors"
        :show-legend="false"
        :rounded-corners="4"
        class="h-80"
      />
    </CardContent>
  </Card>
</template>
