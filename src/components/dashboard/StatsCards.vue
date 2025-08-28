<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-vue-next'

interface Props {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
}

defineProps<Props>()
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <!-- Income Card -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Income</CardTitle>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">${{ monthlyIncome.toFixed(2) }}</div>
        <p class="text-xs text-muted-foreground">+20.1% from last month</p>
      </CardContent>
    </Card>

    <!-- Expenses Card -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Expenses</CardTitle>
        <TrendingDown class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">${{ monthlyExpenses.toFixed(2) }}</div>
        <p class="text-xs text-muted-foreground">+180.1% from last month</p>
      </CardContent>
    </Card>

    <!-- Net Balance Card -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Net Balance</CardTitle>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">${{ (monthlyIncome - monthlyExpenses).toFixed(2) }}</div>
        <p class="text-xs text-muted-foreground">+19% from last month</p>
      </CardContent>
    </Card>
  </div>
</template>
