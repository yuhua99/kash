<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import TransactionsTable from '@/components/TransactionsTable.vue'
import QuickAddTransaction from '@/components/QuickAddTransaction.vue'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

const router = useRouter()
const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

const sortedTransactions = computed(() => {
  return [...recordsStore.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
})

const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
  const category = categoriesStore.categories.find((cat) => cat.name === newTransaction.category)
  if (!category) {
    console.error('Category not found:', newTransaction.category)
    return
  }

  const payload = {
    name: newTransaction.description,
    amount: newTransaction.amount,
    category_id: category.id,
    timestamp: Math.floor(new Date(newTransaction.date).getTime() / 1000),
  }

  await recordsStore.createRecord(payload)
}

const loadData = async () => {
  const isAuthenticated = await authStore.checkAuthStatus()

  if (!isAuthenticated) {
    console.warn('User not authenticated, skipping data load')
    return
  }

  await categoriesStore.fetchCategories()
  await recordsStore.fetchRecords()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">All Transactions</h1>
      <p class="text-muted-foreground">
        View and manage all your financial transactions
      </p>
    </div>

    <!-- Error State -->
    <div
      v-if="authStore.error || recordsStore.error || categoriesStore.error"
      class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
    >
      <p v-if="authStore.error">Authentication Error: {{ authStore.error }}</p>
      <p v-if="recordsStore.error">Records Error: {{ recordsStore.error }}</p>
      <p v-if="categoriesStore.error">Categories Error: {{ categoriesStore.error }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(authStore.clearError(), recordsStore.clearError(), categoriesStore.clearError())"
          class="text-red-700 underline text-sm"
        >
          Dismiss
        </button>
        <button @click="loadData" class="text-red-700 underline text-sm">Retry</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton class="h-6 w-32 mb-2" />
          <Skeleton class="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div v-for="i in 10" :key="i" class="flex items-center space-x-4">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-40" />
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-4 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Not Authenticated State -->
    <div v-else-if="!authStore.isAuthenticated" class="flex items-center justify-center py-12">
      <div class="text-center">
        <h2 class="text-xl font-semibold mb-2">Authentication Required</h2>
        <p class="text-muted-foreground mb-4">Please log in to access your transactions.</p>
        <button
          @click="router.push('/login')"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <Separator />
      
      <!-- Transactions Table -->
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {{ sortedTransactions.length }} transactions total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable :transactions="sortedTransactions" />
        </CardContent>
      </Card>

      <!-- Quick Add Floating Button -->
      <QuickAddTransaction @add-transaction="addTransaction" />
    </div>
  </div>
</template>