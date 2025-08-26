<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DonutChart } from '@/components/ui/chart-donut'

interface Props {
  transactions: Array<{
    id: string
    date: string
    description: string
    amount: number
    category: string
    type: 'income' | 'expense'
  }>
}

const props = defineProps<Props>()

const categorySpending = computed(() => {
  const categoryMap = new Map<string, number>()

  // Only count expenses for category breakdown
  const expenses = props.transactions.filter((t) => t.type === 'expense')
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  expenses.forEach((transaction) => {
    const current = categoryMap.get(transaction.category) || 0
    categoryMap.set(transaction.category, current + Math.abs(transaction.amount))
  })

  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
})

// Chart data for donut chart
const chartData = computed(() => {
  return categorySpending.value.map(item => ({
    name: item.category,
    value: item.amount
  }))
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Spending by Category</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Donut Chart -->
        <div class="flex items-center justify-center">
          <DonutChart
            v-if="chartData.length > 0"
            :data="chartData"
            index="name"
            category="value"
            :value-formatter="(value: number) => `$${value.toFixed(0)}`"
            class="h-48"
          />
          <div v-else class="text-center text-muted-foreground">No expenses found</div>
        </div>
        
        <!-- Text Legend/Table -->
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead class="text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in categorySpending" :key="item.category">
              <TableCell class="font-medium">{{ item.category }}</TableCell>
              <TableCell class="text-right">${{ item.amount.toFixed(2) }}</TableCell>
              <TableCell class="text-right">{{ item.percentage.toFixed(1) }}%</TableCell>
            </TableRow>
            <TableRow v-if="categorySpending.length === 0">
              <TableCell colspan="3" class="text-center text-muted-foreground"
                >No expenses found</TableCell
              >
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
