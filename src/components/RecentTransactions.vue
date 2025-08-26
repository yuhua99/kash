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
import { Button } from '@/components/ui/button'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

interface Props {
  transactions: Transaction[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewAll: []
}>()

const recentTransactions = computed(() => {
  return props.transactions.slice(0, 5)
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const formatAmount = (amount: number, type: 'income' | 'expense') => {
  const formattedAmount = Math.abs(amount).toFixed(2)
  return type === 'income' ? `+$${formattedAmount}` : `-$${formattedAmount}`
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="link" @click="emit('viewAll')" class="p-0 h-auto">View all</Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead class="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="transaction in recentTransactions" :key="transaction.id">
              <TableCell>{{ formatDate(transaction.date) }}</TableCell>
              <TableCell>{{ transaction.category }}</TableCell>
              <TableCell>{{ transaction.description }}</TableCell>
              <TableCell
                class="text-right font-medium"
                :class="transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'"
              >
                {{ formatAmount(transaction.amount, transaction.type) }}
              </TableCell>
            </TableRow>
            <TableRow v-if="recentTransactions.length === 0">
              <TableCell colspan="4" class="text-center text-muted-foreground"
                >No transactions found</TableCell
              >
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
</template>
