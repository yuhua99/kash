<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-vue-next'
import { formatCurrency, formatPercent } from '@/lib/formatters'

interface Props {
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
}

const props = defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- Income (period-aware) -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <CardTitle class="text-xs md:text-sm font-medium">Income</CardTitle>
        <DollarSign class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <div class="text-lg md:text-2xl font-bold">{{ formatCurrency(props.monthlyIncome) }}</div>
      </CardContent>
    </Card>

    <!-- Expenses (period-aware) -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <CardTitle class="text-xs md:text-sm font-medium">Expenses</CardTitle>
        <TrendingDown class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <div class="text-lg md:text-2xl font-bold">{{ formatCurrency(props.monthlyExpenses) }}</div>
      </CardContent>
    </Card>

    <!-- Net (this period) -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <CardTitle class="text-xs md:text-sm font-medium">Net This Period</CardTitle>
        <TrendingUp class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <div class="text-lg md:text-2xl font-bold">
          {{ formatCurrency(props.monthlyIncome - props.monthlyExpenses) }}
        </div>
      </CardContent>
    </Card>

    <!-- Savings Rate -->
    <Card class="py-4">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 md:px-6">
        <CardTitle class="text-xs md:text-sm font-medium">Savings Rate</CardTitle>
        <PiggyBank class="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent class="px-4 md:px-6">
        <div class="text-lg md:text-2xl font-bold">{{ formatPercent(props.savingsRate) }}</div>
        <p class="text-[10px] md:text-xs text-muted-foreground">Income left after expenses</p>
      </CardContent>
    </Card>
  </div>
</template>
