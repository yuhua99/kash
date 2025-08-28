<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import TransactionsTable from '@/components/transactions/TransactionsTable.vue'
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog.vue'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import type { TransactionBase } from '@/components/transactions/TransactionForm.vue'

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

const addTransaction = async (newTransaction: TransactionBase) => {
  const category = categoriesStore.categories.find((cat) => cat.name === newTransaction.category)
  if (!category) {
    console.error('Category not found:', newTransaction.category)
    return
  }

  const payload = {
    name: newTransaction.name,
    amount: newTransaction.amount,
    category_id: category.id,
    timestamp: Math.floor(new Date(newTransaction.date).getTime() / 1000),
  }

  await recordsStore.createRecord(payload)
}

const loadData = async () => {
  const isAuthenticated = await authStore.checkAuthStatus()

  if (!isAuthenticated) {
    console.warn('User not authenticated, redirecting to login')
    router.push('/login')
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
      <p class="text-muted-foreground">View and manage all your financial transactions</p>
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

    <!-- Main Content -->
    <div v-else-if="authStore.isAuthenticated" class="space-y-6">
      <Separator />

      <!-- Transactions Table -->
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription> {{ sortedTransactions.length }} transactions total </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable :transactions="sortedTransactions" />
        </CardContent>
      </Card>

      <!-- Quick Add Floating Button -->
      <AddTransactionDialog @add-transaction="addTransaction">
        <Button
          size="icon"
          class="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus class="h-6 w-6" />
        </Button>
      </AddTransactionDialog>
    </div>
  </div>
</template>
