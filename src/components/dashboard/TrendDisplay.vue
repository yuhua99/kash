<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart } from '@/components/ui/chart-line'

interface Props {
  monthlyIncome: number
  monthlyExpenses: number
}

defineProps<Props>()

const selectedPeriod = ref('monthly')

// Chart data formatted for Unovis LineChart
const chartData = computed(() => {
  if (selectedPeriod.value === 'daily') {
    return [
      { period: 'Mon', income: 120, expenses: 45 },
      { period: 'Tue', income: 0, expenses: 80 },
      { period: 'Wed', income: 300, expenses: 120 },
      { period: 'Thu', income: 0, expenses: 95 },
      { period: 'Fri', income: 450, expenses: 200 },
      { period: 'Sat', income: 200, expenses: 150 },
      { period: 'Sun', income: 100, expenses: 75 },
    ]
  } else if (selectedPeriod.value === 'weekly') {
    return [
      { period: 'Week 1', income: 1200, expenses: 800 },
      { period: 'Week 2', income: 1100, expenses: 950 },
      { period: 'Week 3', income: 1350, expenses: 750 },
      { period: 'Week 4', income: 980, expenses: 900 },
    ]
  } else {
    return [
      { period: 'Jan', income: 4500, expenses: 3200 },
      { period: 'Feb', income: 4200, expenses: 3800 },
      { period: 'Mar', income: 4800, expenses: 3100 },
      { period: 'Apr', income: 4600, expenses: 3500 },
      { period: 'May', income: 5100, expenses: 3900 },
      { period: 'Jun', income: 4900, expenses: 3600 },
    ]
  }
})
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Income/Expense Trend</CardTitle>
        <Tabs v-model="selectedPeriod" class="w-auto">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </CardHeader>
    <CardContent class="p-4">
      <LineChart
        :data="chartData"
        index="period"
        :categories="['income', 'expenses']"
        :colors="['hsl(var(--emerald-600))', 'hsl(var(--rose-600))']"
        :y-formatter="
          (value: number | Date) => `$${typeof value === 'number' ? value.toFixed(0) : '0'}`
        "
        class="h-80"
      />
    </CardContent>
  </Card>
</template>
