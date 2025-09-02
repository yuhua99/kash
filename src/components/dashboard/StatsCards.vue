<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-vue-next'

interface Props {
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
}

const props = defineProps<Props>()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const formatPercent = (value: number) => `${value.toFixed(1)}%`
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- Income (period-aware) -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Income</CardTitle>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(props.monthlyIncome) }}</div>
      </CardContent>
    </Card>

    <!-- Expenses (period-aware) -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Expenses</CardTitle>
        <TrendingDown class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatCurrency(props.monthlyExpenses) }}</div>
      </CardContent>
    </Card>

    <!-- Net (this period) -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Net This Period</CardTitle>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">
          {{ formatCurrency(props.monthlyIncome - props.monthlyExpenses) }}
        </div>
      </CardContent>
    </Card>

    <!-- Savings Rate -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Savings Rate</CardTitle>
        <PiggyBank class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ formatPercent(props.savingsRate) }}</div>
        <p class="text-xs text-muted-foreground">Income left after expenses</p>
      </CardContent>
    </Card>
  </div>
</template>
