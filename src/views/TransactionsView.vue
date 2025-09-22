<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import TransactionsTable from '@/components/transactions/TransactionsTable.vue'
import TransactionHeader from '@/components/transactions/TransactionHeader.vue'
import FiltersDropdown from '@/components/transactions/FiltersDropdown.vue'
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog.vue'
import FloatingButton from '@/components/common/FloatingButton.vue'
import { Search, Plus } from 'lucide-vue-next'
import { useRecordsStore } from '@/stores/records'
import { useCategoriesStore } from '@/stores/categories'
import { useAuthStore } from '@/stores/auth'
import type { Transaction } from '@/types'
import type { Range } from '@/types'
import { formatSignedCurrency } from '@/lib/formatters'

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
})
const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
})
const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatRangeLabel = (range?: Range): string => {
  if (!range) return 'Transactions'

  const { start, end } = range
  const hasValidTimestamps = Number.isFinite(start) && Number.isFinite(end) && end >= start
  if (!hasValidTimestamps) return 'Transactions'

  if (start <= 0 || end <= 0) return 'All transactions'

  const startDate = new Date(start * 1000)
  const endDate = new Date(end * 1000)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Transactions'
  }

  const monthStartSeconds = Math.floor(
    new Date(startDate.getFullYear(), startDate.getMonth(), 1).getTime() / 1000,
  )
  const monthEndSeconds = Math.floor(
    new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999).getTime() /
      1000,
  )
  if (start === monthStartSeconds && end === monthEndSeconds) {
    return `${monthYearFormatter.format(startDate)} transactions`
  }

  const yearStartSeconds = Math.floor(new Date(startDate.getFullYear(), 0, 1).getTime() / 1000)
  const yearEndSeconds = Math.floor(
    new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999).getTime() / 1000,
  )
  if (start === yearStartSeconds && end === yearEndSeconds) {
    return `${startDate.getFullYear()} transactions`
  }

  const isSameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate()

  if (isSameDay) {
    return `${fullDateFormatter.format(startDate)} transactions`
  }

  const isSameYear = startDate.getFullYear() === endDate.getFullYear()
  if (isSameYear) {
    return `${monthDayFormatter.format(startDate)} – ${monthDayFormatter.format(endDate)} ${startDate.getFullYear()} transactions`
  }

  return `${fullDateFormatter.format(startDate)} – ${fullDateFormatter.format(endDate)} transactions`
}

const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

// Filter and search state
const PAGE_SIZE = 100
const searchQuery = ref('')
const selectedCategory = ref('all')
const now = new Date()
const defaultStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000)
const defaultEnd =
  Math.floor(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000) - 1
const selectedRange = ref<Range>({ start: defaultStart, end: defaultEnd })
const currentPage = ref(1)

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

// Get unique categories for filter dropdown
const availableCategories = computed(() => {
  const categories = new Set(recordsStore.viewTransactions.map((t) => t.category))
  return Array.from(categories).sort()
})

const filteredTransactions = computed(() => {
  let filtered = [...recordsStore.viewTransactions]

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((transaction) => transaction.name.toLowerCase().includes(query))
  }

  // Apply category filter
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter((transaction) => transaction.category === selectedCategory.value)
  }

  return filtered
})

const totalTransactions = computed(() => recordsStore.viewTotalRecords)

// Summary statistics for filtered transactions
const filteredStats = computed(() => {
  const transactions = filteredTransactions.value
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

const transactionsSubtitle = computed(() => {
  const label = formatRangeLabel(selectedRange.value)
  const total = Number(totalTransactions.value ?? 0)

  if (!Number.isFinite(total) || total <= 0) {
    return label
  }

  const filteredCount = filteredTransactions.value.length
  return `${label} · ${filteredCount} of ${total}`
})

const fetchTransactionsForRange = async () => {
  const { start, end } = selectedRange.value
  if (!start || !end) return

  await recordsStore.fetchRecordsForPeriod({
    start_time: start,
    end_time: end,
    limit: PAGE_SIZE,
    offset: (currentPage.value - 1) * PAGE_SIZE,
  })
}

const addTransaction = async (newTransaction: Transaction) => {
  const category = categoriesStore.categories.find((cat) => cat.name === newTransaction.category)
  if (!category) {
    console.error('Category not found:', newTransaction.category)
    return
  }

  const payload = {
    name: newTransaction.name,
    amount: newTransaction.amount,
    category_id: category.id,
    timestamp: newTransaction.timestamp,
  }

  const created = await recordsStore.createRecord(payload)
  if (!created) {
    console.error('Failed to create transaction')
  }
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
    timestamp: transaction.timestamp,
  }

  const updated = await recordsStore.updateRecord(transaction.id, payload)
  if (!updated) {
    console.error('Failed to update transaction', transaction.id)
  }
}

const deleteTransaction = async (id: string) => {
  const success = await recordsStore.deleteRecord(id)
  if (!success) {
    console.error('Failed to delete transaction', id)
    return
  }

  const total = recordsStore.viewTotalRecords ?? 0
  if (total <= 0) {
    currentPage.value = 1
    return
  }

  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
    await fetchTransactionsForRange()
    return
  }

  const offset = (currentPage.value - 1) * PAGE_SIZE
  const expectedCount = Math.max(0, Math.min(PAGE_SIZE, total - offset))
  if (recordsStore.viewRecords.length < expectedCount) {
    await fetchTransactionsForRange()
  }
}

const loadData = async () => {
  await categoriesStore.fetchCategories()
  await recordsStore.fetchLatestRecords()
  currentPage.value = 1
  await fetchTransactionsForRange()
}

const onFiltersApply = async (payload: { range: Range; category: string }) => {
  const { range, category } = payload
  const hasRangeChanged =
    range.start !== selectedRange.value.start || range.end !== selectedRange.value.end

  selectedRange.value = range
  selectedCategory.value = category

  if (hasRangeChanged) {
    currentPage.value = 1
  }

  await fetchTransactionsForRange()
}

onMounted(() => {
  loadData()
})

const onPageChange = async (page: number) => {
  if (page === currentPage.value) return
  currentPage.value = page
  await fetchTransactionsForRange()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <TransactionHeader :loading="isLoading" />

    <!-- Error State -->
    <div
      v-if="authStore.error || recordsStore.error || categoriesStore.error"
      class="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded"
    >
      <p v-if="authStore.error">Authentication Error: {{ authStore.error }}</p>
      <p v-if="recordsStore.error">Records Error: {{ recordsStore.error }}</p>
      <p v-if="categoriesStore.error">Categories Error: {{ categoriesStore.error }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(authStore.clearError(), recordsStore.clearError(), categoriesStore.clearError())"
          class="text-destructive underline text-sm"
        >
          Dismiss
        </button>
        <button @click="loadData" class="text-destructive underline text-sm">Retry</button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="authStore.isAuthenticated" class="space-y-6">
      <!-- Search and Filters -->
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search Bar -->
        <div class="relative flex-1">
          <template v-if="isLoading">
            <Skeleton variant="input" size="md" class="w-full" />
          </template>
          <template v-else>
            <Search
              class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              placeholder="Search transactions..."
              class="pl-10"
              :disabled="isLoading"
            />
          </template>
        </div>

        <!-- Filters: unified dropdown on all devices -->
        <div class="w-full sm:w-auto">
          <FiltersDropdown
            :range="selectedRange"
            :category="selectedCategory"
            :categories="availableCategories"
            :loading="isLoading"
            @apply="onFiltersApply"
          />
        </div>
      </div>

      <!-- Stats Summary (when filtered) -->
      <div
        v-if="isLoading || searchQuery || selectedCategory !== 'all'"
        class="grid gap-4 md:grid-cols-4"
      >
        <template v-if="isLoading">
          <Card v-for="i in 4" :key="`summary-skeleton-${i}`">
            <CardContent class="p-4 space-y-2">
              <SkeletonText class="w-24" size="sm" />
              <SkeletonText class="w-20" size="lg" />
            </CardContent>
          </Card>
        </template>
        <template v-else>
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground">Filtered Results</div>
              <div class="text-2xl font-bold">{{ filteredStats.count }}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground">Income</div>
              <div class="text-2xl font-bold text-[hsl(var(--vis-secondary-color))]">
                {{ formatSignedCurrency(filteredStats.totalIncome) }}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground">Expenses</div>
              <div class="text-2xl font-bold text-[hsl(var(--vis-primary-color))]">
                {{ formatSignedCurrency(-filteredStats.totalExpenses) }}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground">Net</div>
              <div
                class="text-2xl font-bold"
                :class="
                  filteredStats.netAmount >= 0
                    ? 'text-[hsl(var(--vis-secondary-color))]'
                    : 'text-[hsl(var(--vis-primary-color))]'
                "
              >
                {{ formatSignedCurrency(filteredStats.netAmount) }}
              </div>
            </CardContent>
          </Card>
        </template>
      </div>

      <!-- Transactions Table -->
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <template v-if="isLoading">
                <SkeletonText class="w-40" size="lg" />
                <SkeletonText class="w-48 mt-2" size="sm" />
              </template>
              <template v-else>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  {{ transactionsSubtitle }}
                </CardDescription>
              </template>
            </div>
            <div class="flex items-center gap-2">
              <!-- Active filters display -->
              <div
                v-if="!isLoading && (searchQuery || selectedCategory)"
                class="flex items-center gap-2 mr-4"
              >
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
            :transactions="filteredTransactions"
            :total-transactions="totalTransactions"
            :page="currentPage"
            :page-size="PAGE_SIZE"
            :loading="isLoading"
            @edit-transaction="editTransaction"
            @delete-transaction="deleteTransaction"
            @page-change="onPageChange"
          />
        </CardContent>
      </Card>

      <AddTransactionDialog v-if="!isLoading" @add-transaction="addTransaction">
        <FloatingButton aria-label="Add transaction">
          <Plus class="h-6 w-6" />
        </FloatingButton>
      </AddTransactionDialog>
    </div>
  </div>
</template>
