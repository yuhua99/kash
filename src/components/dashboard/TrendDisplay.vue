<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart } from '@/components/ui/chart-line'
import { CurveType } from '@unovis/ts'
import { useChartData } from '@/composables/useChartData'
import type { Transaction } from '@/types'
import TrendTooltip from './TrendTooltip.vue'

interface Props {
  transactions: Transaction[]
}

const props = defineProps<Props>()

// Process transaction data using the chart data composable
const transactionsRef = computed(() => props.transactions)
const { monthlyTrendData } = useChartData(transactionsRef)

const selectedPeriod = ref('monthly')

// Helper function to get all days in current month
const getCurrentMonthDays = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

// Helper function to get last N weeks
const getLastNWeeks = (n: number) => {
  const weeks = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - i * 7 - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weeks.push({
      label: `Week ${n - i}`,
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    })
  }
  return weeks
}

// Process daily data (entire current month)
const dailyTrendData = computed(() => {
  const currentMonthDays = getCurrentMonthDays()

  return currentMonthDays.map((date) => {
    const dayTransactions = props.transactions.filter((t) => t.date === date)
    const income = dayTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = dayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // Format date as MM/DD (e.g., "08/31")
    const dateObj = new Date(date)
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
    const day = dateObj.getDate().toString().padStart(2, '0')

    return {
      period: `${month}/${day}`,
      income,
      expenses,
    }
  })
})

// Process weekly data (last 4 weeks)
const weeklyTrendData = computed(() => {
  const last4Weeks = getLastNWeeks(4)

  return last4Weeks.map((week) => {
    const weekTransactions = props.transactions.filter(
      (t) => t.date >= week.start && t.date <= week.end,
    )
    const income = weekTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = weekTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      period: week.label,
      income,
      expenses,
    }
  })
})

// Process monthly data - transform the existing monthlyTrendData format
const processedMonthlyData = computed(() => {
  return monthlyTrendData.value.slice(-6).map((item) => ({
    period: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    income: item.income,
    expenses: item.expenses,
  }))
})

// Chart data formatted for Unovis LineChart
const chartData = computed(() => {
  if (selectedPeriod.value === 'daily') {
    return dailyTrendData.value
  } else if (selectedPeriod.value === 'weekly') {
    return weeklyTrendData.value
  } else {
    return processedMonthlyData.value
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
        :colors="['#059669', '#dc2626']"
        :y-formatter="
          (value: number | Date) => {
            if (typeof value === 'number') {
              return `$${value.toFixed(0)}`
            }
            return '$0'
          }
        "
        :curve-type="CurveType.MonotoneX"
        :custom-tooltip="TrendTooltip"
        class="h-80"
      />
    </CardContent>
  </Card>
</template>
