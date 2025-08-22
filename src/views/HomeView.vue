<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const totalBalance = ref(2847.5)
const monthlyIncome = ref(3500.0)
const monthlyExpenses = ref(1652.5)

const recentTransactions = ref([
  { description: 'Grocery Store', amount: -85.32, category: 'Food' },
  { description: 'Salary Deposit', amount: 3500.0, category: 'Income' },
  { description: 'Electric Bill', amount: -127.45, category: 'Utilities' },
])
</script>

<template>
  <main class="p-6">
    <h1 class="text-2xl font-bold mb-6">Budget Dashboard</h1>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold">${{ totalBalance }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold text-green-600">${{ monthlyIncome }}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold text-red-600">${{ monthlyExpenses }}</p>
        </CardContent>
      </Card>
    </div>

    <!-- Actions -->
    <div class="flex gap-4 mb-8">
      <Button>Add Transaction</Button>
      <Button variant="outline">View Reports</Button>
    </div>

    <!-- Recent Transactions -->
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div
            v-for="transaction in recentTransactions"
            :key="transaction.description"
            class="flex justify-between items-center border-b pb-2"
          >
            <div>
              <p class="font-medium">{{ transaction.description }}</p>
              <p class="text-sm text-gray-500">{{ transaction.category }}</p>
            </div>
            <p :class="['font-bold', transaction.amount > 0 ? 'text-green-600' : 'text-red-600']">
              ${{ Math.abs(transaction.amount) }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </main>
</template>
