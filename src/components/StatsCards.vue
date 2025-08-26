<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium">Income (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-emerald-600">${{ monthlyIncome.toFixed(2) }}</div>
        <Badge variant="outline" class="text-xs mt-1">Income up 8% vs last month</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium">Expense (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-rose-600">${{ monthlyExpenses.toFixed(2) }}</div>
        <Badge variant="outline" class="text-xs mt-1">Spending up 12% vs last month</Badge>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium">Net Balance (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold text-slate-700">
          ${{ (monthlyIncome - monthlyExpenses).toFixed(2) }}
        </div>
        <Badge variant="outline" class="text-xs mt-1">Net down $240 vs last month</Badge>
      </CardContent>
    </Card>
  </div>
</template>
