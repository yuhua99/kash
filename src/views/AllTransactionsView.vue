<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import TransactionsTable from '@/components/transactions/TransactionsTable.vue'
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog.vue'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, Download } from 'lucide-vue-next'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import type { TransactionBase } from '@/components/transactions/TransactionForm.vue'
import type { Transaction } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

// Filter and search state
const searchQuery = ref('')
const selectedCategory = ref('')

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

// Get unique categories for filter dropdown
const availableCategories = computed(() => {
  const categories = new Set(recordsStore.transactions.map((t) => t.category))
  return Array.from(categories).sort()
})

const filteredAndSortedTransactions = computed(() => {
  let filtered = [...recordsStore.transactions]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(
      (transaction) =>
        transaction.name.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query),
    )
  }

  // Apply category filter
  if (selectedCategory.value && selectedCategory.value !== 'all') {
    filtered = filtered.filter((transaction) => transaction.category === selectedCategory.value)
  }

  // Sort by date (most recent first)
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Summary statistics for filtered transactions
const filteredStats = computed(() => {
  const transactions = filteredAndSortedTransactions.value
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return {
    count: transactions.length,
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
  }
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

const editTransaction = async (transaction: Transaction) => {
  const category = categoriesStore.categories.find((cat) => cat.name === transaction.category)
  if (!category) {
    console.error('Category not found:', transaction.category)
    return
  }

  const payload = {
    name: transaction.name,
    amount: transaction.amount,
    category_id: category.id,
    timestamp: Math.floor(new Date(transaction.date).getTime() / 1000),
  }

  await recordsStore.updateRecord(transaction.id, payload)
}

const deleteTransaction = async (id: string) => {
  await recordsStore.deleteRecord(id)
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

// Clear filters
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
}

// Export functionality (placeholder)
const exportTransactions = () => {
  console.log('Export functionality - TODO: implement CSV/PDF export')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight">All Transactions</h1>
        <p class="text-muted-foreground">View and manage all your financial transactions</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="exportTransactions">
          <Download class="h-4 w-4 mr-2" />
          Export
        </Button>
        <AddTransactionDialog @add-transaction="addTransaction">
          <Button size="sm">
            <Plus class="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </AddTransactionDialog>
      </div>
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
      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search Bar -->
        <div class="relative flex-1">
          <Search
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input v-model="searchQuery" placeholder="Search transactions..." class="pl-10" />
        </div>

        <!-- Category Filter -->
        <Select v-model="selectedCategory">
          <SelectTrigger class="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem v-for="category in availableCategories" :key="category" :value="category">
              {{ category }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Clear Filters Button -->
        <Button
          variant="outline"
          size="default"
          @click="clearFilters"
          v-if="searchQuery || selectedCategory"
        >
          <Filter class="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      <!-- Stats Summary (when filtered) -->
      <div v-if="searchQuery || selectedCategory" class="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">Filtered Results</div>
            <div class="text-2xl font-bold">{{ filteredStats.count }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">Income</div>
            <div class="text-2xl font-bold text-green-600">
              +${{ filteredStats.totalIncome.toFixed(2) }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">Expenses</div>
            <div class="text-2xl font-bold text-red-600">
              -${{ filteredStats.totalExpenses.toFixed(2) }}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">Net</div>
            <div
              class="text-2xl font-bold"
              :class="filteredStats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ filteredStats.netAmount >= 0 ? '+' : '' }}${{ filteredStats.netAmount.toFixed(2) }}
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Transactions Table -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Showing {{ filteredAndSortedTransactions.length }} of
                {{ recordsStore.transactions.length }} transactions
              </CardDescription>
            </div>
            <div class="flex items-center gap-2">
              <!-- Active filters display -->
              <div v-if="searchQuery || selectedCategory" class="flex items-center gap-2 mr-4">
                <Badge v-if="searchQuery" variant="secondary" class="text-xs">
                  Search: {{ searchQuery }}
                </Badge>
                <Badge
                  v-if="selectedCategory && selectedCategory !== 'all'"
                  variant="secondary"
                  class="text-xs"
                >
                  {{ selectedCategory }}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent class="px-6 pb-6">
          <TransactionsTable
            :transactions="filteredAndSortedTransactions"
            @edit-transaction="editTransaction"
            @delete-transaction="deleteTransaction"
          />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
