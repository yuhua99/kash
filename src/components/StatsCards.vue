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
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total Balance</CardTitle>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">${{ totalBalance.toFixed(2) }}</div>
        <p class="text-xs text-muted-foreground">Current account balance</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Monthly Income</CardTitle>
        <TrendingUp class="h-4 w-4 text-green-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-green-600">${{ monthlyIncome.toFixed(2) }}</div>
        <p class="text-xs text-muted-foreground">Total income this month</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Monthly Expenses</CardTitle>
        <TrendingDown class="h-4 w-4 text-red-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-red-600">${{ monthlyExpenses.toFixed(2) }}</div>
        <p class="text-xs text-muted-foreground">Total expenses this month</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Savings Rate</CardTitle>
        <TrendingUp class="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-blue-600">{{ savingsRate.toFixed(1) }}%</div>
        <p class="text-xs text-muted-foreground">Of total income saved</p>
      </CardContent>
    </Card>
  </div>
</template>
