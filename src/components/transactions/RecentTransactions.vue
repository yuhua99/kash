<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCategoriesStore } from '@/stores/categories'
import type { Transaction } from '@/types'
import { TransactionType } from '@/types'

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

const formatAmount = (amount: number, type: TransactionType) => {
  const formattedAmount = Math.abs(amount).toFixed(2)
  return type === TransactionType.INCOME ? `+$${formattedAmount}` : `-$${formattedAmount}`
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center">
      <div class="grid gap-2">
        <CardTitle>Recent Transactions</CardTitle>
        <p class="text-sm text-muted-foreground">
          You made {{ recentTransactions.length }} transactions this month.
        </p>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-8">
        <div
          v-for="transaction in recentTransactions"
          :key="transaction.id"
          class="flex items-center"
        >
          <div
            class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium text-white"
            :style="{
              backgroundColor: categoriesStore.getCategoryColorByName(
                transaction.category,
                isDarkMode,
              ),
            }"
          >
            {{ transaction.category.charAt(0).toUpperCase() }}
          </div>
          <div class="ml-4 space-y-1">
            <p class="text-sm font-medium leading-none">{{ transaction.name }}</p>
            <p class="text-sm text-muted-foreground">
              {{ transaction.category }}
            </p>
          </div>
          <div
            class="ml-auto font-medium"
            :class="
              transaction.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
            "
          >
            {{ formatAmount(transaction.amount, transaction.type) }}
          </div>
        </div>
        <div v-if="recentTransactions.length === 0" class="flex items-center justify-center py-6">
          <p class="text-sm text-muted-foreground">No recent transactions</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
