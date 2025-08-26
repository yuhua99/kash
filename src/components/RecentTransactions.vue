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
import { useCategoriesStore } from '@/stores/categories'

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
const categoriesStore = useCategoriesStore()

const isDarkMode = computed(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

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
      <CardTitle>Recent Transactions</CardTitle>
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
              <TableCell>
                <div class="flex items-center space-x-2">
                  <div
                    class="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    :style="{
                      backgroundColor: categoriesStore.getCategoryColorByName(
                        transaction.category,
                        isDarkMode,
                      ),
                    }"
                  ></div>
                  <span>{{ transaction.category }}</span>
                </div>
              </TableCell>
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
