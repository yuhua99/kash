<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart } from '@/components/ui/chart-bar'
import type { Transaction } from '@/types'
import { TransactionType } from '@/types'
import TrendTooltip from './TrendTooltip.vue'

enum DataType {
  INCOME = 'income',
  EXPENSES = 'expenses',
}

interface Props {
  transactions: Transaction[]
  period: string
}

const props = defineProps<Props>()

const selectedDataType = ref<DataType>(DataType.EXPENSES)

// Map dashboard period to chart granularity
const chartPeriod = computed(() => {
  switch (props.period) {
    case 'this-month':
      return 'daily'
    case 'this-half-year':
      return 'weekly'
    case 'this-year':
      return 'monthly'
    default:
      return 'monthly'
  }
})

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

    // Format week label as "Week of MM/DD"
    const weekStartMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0')
    const weekStartDay = weekStart.getDate().toString().padStart(2, '0')

    weeks.push({
      label: `${weekStartMonth}/${weekStartDay}`,
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
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = dayTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
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

// Process weekly data (last 26 weeks for half year)
const weeklyTrendData = computed(() => {
  const last26Weeks = getLastNWeeks(26)

  return last26Weeks.map((week) => {
    const weekTransactions = props.transactions.filter(
      (t) => t.date >= week.start && t.date <= week.end,
    )
    const income = weekTransactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = weekTransactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return {
      period: week.label,
      income,
      expenses,
    }
  })
})

// Process monthly data - show 12 months for this year
const processedMonthlyData = computed(() => {
  // Create a more comprehensive monthly aggregation directly from transactions
  const monthlyData = new Map<string, { income: number; expenses: number }>()

  // Generate the last 12 months
  const months = []
  const today = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })

    months.push({ monthKey, monthLabel })
    monthlyData.set(monthKey, { income: 0, expenses: 0 })
  }

  // Aggregate transaction data by month
  props.transactions.forEach((transaction) => {
    const monthKey = transaction.date.substring(0, 7) // YYYY-MM format
    const current = monthlyData.get(monthKey)

    if (current) {
      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount
      } else {
        current.expenses += Math.abs(transaction.amount)
      }
    }
  })

  return months.map(({ monthKey, monthLabel }) => {
    const data = monthlyData.get(monthKey) || { income: 0, expenses: 0 }
    return {
      period: monthLabel,
      income: data.income,
      expenses: data.expenses,
    }
  })
})

// Chart data formatted for single data series
const chartData = computed(() => {
  let baseData
  if (chartPeriod.value === 'daily') {
    baseData = dailyTrendData.value
  } else if (chartPeriod.value === 'weekly') {
    baseData = weeklyTrendData.value
  } else {
    baseData = processedMonthlyData.value
  }

  // Transform data to show only selected data type
  return baseData.map((item) => ({
    period: item.period,
    value: selectedDataType.value === DataType.INCOME ? item.income : item.expenses,
  }))
})

// Chart configuration based on selected data type
const chartCategories = computed(() => ['value' as keyof { period: string; value: number }])
const chartColors = computed(() => [
  selectedDataType.value === DataType.INCOME ? '#059669' : '#dc2626',
])
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle
          >{{ selectedDataType === DataType.INCOME ? 'Income' : 'Expense' }} Trend</CardTitle
        >
        <!-- Data Type Tabs -->
        <Tabs v-model="selectedDataType" class="w-auto">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger :value="DataType.INCOME">Income</TabsTrigger>
            <TabsTrigger :value="DataType.EXPENSES">Expenses</TabsTrigger>
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
        :y-formatter="
          (value: number | Date) => {
            if (typeof value === 'number') {
              return `$${value.toFixed(0)}`
            }
            return '$0'
          }
        "
        :custom-tooltip="TrendTooltip"
        :rounded-corners="4"
        class="h-80"
      />
    </CardContent>
  </Card>
</template>
