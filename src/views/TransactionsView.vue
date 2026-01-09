<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useRecordsStore } from "@/stores/records"
import { useCategoriesStore } from "@/stores/categories"
import { formatSignedCurrency } from "@/lib/formatters"
import { getRangeForPeriod } from "@/lib/timeRange"
import type { Transaction } from "@/types"
import { PeriodUnit, TransactionType } from "@/types"
import {
  Button,
  DropdownMenu,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Dialog,
  Form,
  DataTable,
  ConfirmationDialog,
} from "@/components/ui"
import type { DropdownMenuItem } from "@/components/ui/DropdownMenu.vue"
import type { Column } from "@/components/ui/DataTable.vue"

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const recordsStore = useRecordsStore()
const categoriesStore = useCategoriesStore()

const PAGE_SIZE = 100

const searchQuery = ref("")
const selectedCategoryId = ref("all")
const selectedPeriod = ref<PeriodUnit>(PeriodUnit.MONTH)
const currentPage = ref(1)
const sortColumn = ref("timestamp")
const sortDirection = ref<"asc" | "desc">("desc")

const showForm = ref(false)
const formMode = ref<"add" | "edit">("add")
const editingId = ref<string | null>(null)

const confirmOpen = ref(false)
const confirmTitle = ref("")
const confirmDescription = ref("")
const confirmVariant = ref<"default" | "destructive">("default")
const confirmLoading = ref(false)
const confirmAction = ref<() => Promise<void>>(async () => {})

const formName = ref("")
const formAmount = ref("")
const formCategoryId = ref("")
const formType = ref<TransactionType>(TransactionType.EXPENSE)
const formDate = ref(new Date().toISOString().slice(0, 10))

const categoryDialogOpen = ref(false)
const categoryName = ref("")
const categoryIsIncome = ref(false)
const editingCategoryId = ref<string | null>(null)

const isLoading = computed(
  () => authStore.isLoading || recordsStore.isLoading || categoriesStore.isLoading,
)

const periodOptions = [
  { label: "Month", value: PeriodUnit.MONTH },
  { label: "Half year", value: PeriodUnit.HALF_YEAR },
  { label: "Year", value: PeriodUnit.YEAR },
]

const selectedRange = computed(() => getRangeForPeriod(selectedPeriod.value))

const availableCategories = computed(() => categoriesStore.categories)

const categoryOptions = computed(() => [
  { label: "All", value: "all" },
  ...availableCategories.value.map((c) => ({ label: c.name, value: c.id })),
])

const formCategoryOptions = computed(() =>
  availableCategories.value.map((c) => ({ label: c.name, value: c.id })),
)

const transactionTypeOptions = [
  { label: "Income", value: TransactionType.INCOME },
  { label: "Expense", value: TransactionType.EXPENSE },
]

const filteredTransactions = computed(() => {
  let list = [...recordsStore.viewTransactions]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter((transaction) => transaction.name.toLowerCase().includes(query))
  }

  if (selectedCategoryId.value !== "all") {
    list = list.filter((transaction) => transaction.category_id === selectedCategoryId.value)
  }

  return list
})

const totalPages = computed(() => {
  const total = recordsStore.viewTotalRecords ?? 0
  return Math.max(1, Math.ceil(total / PAGE_SIZE))
})

const transactionsSubtitle = computed(() => {
  const total = recordsStore.viewTotalRecords ?? 0
  const filtered = filteredTransactions.value.length
  const range = selectedRange.value
  const start = new Date(range.start * 1000).toLocaleDateString()
  const end = new Date(range.end * 1000).toLocaleDateString()
  return `${start} → ${end} · ${filtered} of ${total}`
})

const saveButtonText = computed(() =>
  formMode.value === "add" ? "Save transaction" : "Update transaction",
)

const categoryButtonText = computed(() =>
  editingCategoryId.value ? "Update category" : "Add category",
)

const overflowMenuItems: DropdownMenuItem[] = [
  { id: "manage-categories", label: "Manage categories", value: "manage-categories" },
]

const columns: Column[] = [
  { key: "timestamp", label: "Date", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "category", label: "Category" },
  { key: "amount", label: "Amount", align: "right", sortable: true },
  { key: "actions", label: "Actions", align: "right" },
]

const handleSort = (key: string) => {
  if (sortColumn.value === key) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  } else {
    sortColumn.value = key
    sortDirection.value = "desc" // Default to newest/highest first usually
  }
  currentPage.value = 1
  fetchTransactionsForRange()
}

const handleOverflowMenuSelect = (item: DropdownMenuItem) => {
  if (item.value === "manage-categories") {
    openCategoryDialog()
  }
}

const fetchTransactionsForRange = async () => {
  const { start, end } = selectedRange.value
  await recordsStore.fetchRecordsForPeriod({
    start_time: start,
    end_time: end,
    limit: PAGE_SIZE,
    offset: (currentPage.value - 1) * PAGE_SIZE,
    sort_column: sortColumn.value,
    sort_direction: sortDirection.value,
  })
}

const loadData = async () => {
  await categoriesStore.fetchCategories()
  await fetchTransactionsForRange()
}

const resetForm = () => {
  formName.value = ""
  formAmount.value = ""
  formCategoryId.value = ""
  formType.value = TransactionType.EXPENSE
  formDate.value = new Date().toISOString().slice(0, 10)
  editingId.value = null
  formMode.value = "add"
}

const openAddForm = () => {
  resetForm()
  if (categoriesStore.categories.length) {
    formCategoryId.value = categoriesStore.categories[0].id
  }
  showForm.value = true
}

const openEditForm = (transaction: Transaction) => {
  formMode.value = "edit"
  editingId.value = transaction.id
  formName.value = transaction.name
  formAmount.value = Math.abs(transaction.amount).toString()
  formCategoryId.value = transaction.category_id
  formType.value = transaction.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE
  formDate.value = new Date(transaction.timestamp * 1000).toISOString().slice(0, 10)
  showForm.value = true
}

const saveTransaction = async () => {
  if (!formName.value || !formAmount.value || !formCategoryId.value) return

  const amountValue = Math.abs(Number(formAmount.value))
  if (!Number.isFinite(amountValue)) return

  const timestamp = Math.floor(new Date(formDate.value).getTime() / 1000)
  if (!Number.isFinite(timestamp)) return
  const amount = formType.value === TransactionType.INCOME ? amountValue : -amountValue

  if (formMode.value === "add") {
    await recordsStore.createRecord({
      name: formName.value,
      amount,
      category_id: formCategoryId.value,
      timestamp,
    })
  } else if (editingId.value) {
    await recordsStore.updateRecord(editingId.value, {
      name: formName.value,
      amount,
      category_id: formCategoryId.value,
      timestamp,
    })
  }

  await fetchTransactionsForRange()
  showForm.value = false
  resetForm()
}

const requestDeleteTransaction = (id: string) => {
  confirmTitle.value = "Delete Transaction"
  confirmDescription.value = "Are you sure you want to delete this transaction?"
  confirmVariant.value = "destructive"
  confirmAction.value = async () => {
    await recordsStore.deleteRecord(id)
    const total = recordsStore.viewTotalRecords ?? 0
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
      return // fetch will be triggered by watcher
    }
    await fetchTransactionsForRange()
  }
  confirmOpen.value = true
}

const handleConfirmAction = async () => {
  confirmLoading.value = true
  try {
    await confirmAction.value()
    confirmOpen.value = false
  } finally {
    confirmLoading.value = false
  }
}

const openCategoryDialog = () => {
  categoryDialogOpen.value = true
}

const closeCategoryDialog = () => {
  categoryDialogOpen.value = false
  router.replace({ query: { ...route.query, manageCategories: undefined } })
}

const startEditCategory = (categoryId: string) => {
  const target = categoriesStore.categories.find((cat) => cat.id === categoryId)
  if (!target) return
  editingCategoryId.value = target.id
  categoryName.value = target.name
  categoryIsIncome.value = target.is_income
}

const resetCategoryForm = () => {
  categoryName.value = ""
  categoryIsIncome.value = false
  editingCategoryId.value = null
}

const saveCategory = async () => {
  if (!categoryName.value.trim()) return

  if (editingCategoryId.value) {
    await categoriesStore.updateCategory(editingCategoryId.value, {
      name: categoryName.value.trim(),
      is_income: categoryIsIncome.value,
    })
  } else {
    await categoriesStore.createCategory({
      name: categoryName.value.trim(),
      is_income: categoryIsIncome.value,
    })
  }

  resetCategoryForm()
}

const requestDeleteCategory = (categoryId: string) => {
  confirmTitle.value = "Delete Category"
  confirmDescription.value = "Are you sure you want to delete this category?"
  confirmVariant.value = "destructive"
  confirmAction.value = async () => {
    await categoriesStore.deleteCategory(categoryId)
  }
  confirmOpen.value = true
}

watch(
  () => route.query.manageCategories,
  (value) => {
    if (value) {
      categoryDialogOpen.value = true
    }
  },
  { immediate: true },
)

watch(selectedPeriod, async () => {
  currentPage.value = 1
  await fetchTransactionsForRange()
})

watch(currentPage, fetchTransactionsForRange)

onMounted(() => {
  loadData()
})
</script>

<template>
  <section class="space-y-8">
    <header class="space-y-4 border-b border-[var(--text-base)] pb-6">
      <div class="flex items-start justify-between gap-6">
        <div>
          <div class="text-xs uppercase tracking-widest">Transactions</div>
          <h1 class="mt-2 text-2xl font-semibold uppercase tracking-widest">Ledger</h1>
          <p class="mt-2 text-sm text-[var(--text-muted)]">
            {{ transactionsSubtitle }}
          </p>
        </div>

        <DropdownMenu :items="overflowMenuItems" align="right" @select="handleOverflowMenuSelect">
          <template #trigger>
            <Button type="button" text="More" />
          </template>
        </DropdownMenu>
      </div>

      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-[220px]">
          <Input v-model="searchQuery" label="Search" placeholder="Search by name" type="search" />
        </div>

        <div class="min-w-[180px]">
          <Select
            v-model="selectedCategoryId"
            :options="categoryOptions"
            label="Category"
            searchable
          />
        </div>

        <div class="min-w-[180px]">
          <Select v-model="selectedPeriod" :options="periodOptions" label="Period" />
        </div>

        <div class="flex items-end pb-0.5">
          <Button type="button" text="Add transaction" @click="openAddForm" />
        </div>
      </div>
    </header>

    <div v-if="authStore.error || recordsStore.error || categoriesStore.error" class="space-y-2">
      <div class="border border-[var(--text-base)] px-4 py-3 text-xs">
        <div v-if="authStore.error || recordsStore.error || categoriesStore.error">
          Auth: {{ authStore.error }}
        </div>
        <div v-if="recordsStore.error">Records: {{ recordsStore.error }}</div>
        <div v-if="categoriesStore.error">Categories: {{ categoriesStore.error }}</div>
        <Button
          type="button"
          text="Dismiss"
          @click="(authStore.clearError(), recordsStore.clearError(), categoriesStore.clearError())"
          class="mt-2 underline"
        />
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredTransactions"
      :loading="isLoading"
      :sort-column="sortColumn"
      :sort-direction="sortDirection"
      @sort="handleSort"
    >
      <template #cell-timestamp="{ value }">
        {{ value ? new Date(value * 1000).toLocaleDateString() : "" }}
      </template>
      <template #cell-amount="{ value }">
        {{ formatSignedCurrency(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="text-xs uppercase tracking-widest underline hover:text-[var(--text-muted)]"
            @click="openEditForm(row as Transaction)"
          >
            Edit
          </button>
          <button
            type="button"
            class="text-xs uppercase tracking-widest underline hover:text-[var(--text-muted)]"
            @click="requestDeleteTransaction((row as Transaction).id)"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <div class="flex items-center justify-between text-xs uppercase tracking-widest">
      <Button
        type="button"
        text="Prev"
        :disabled="currentPage <= 1"
        @click="currentPage = Math.max(1, currentPage - 1)"
      />
      <div>Page {{ currentPage }} of {{ totalPages }}</div>
      <Button
        type="button"
        text="Next"
        :disabled="currentPage >= totalPages"
        @click="currentPage = Math.min(totalPages, currentPage + 1)"
      />
    </div>
  </section>

  <!-- Add/Edit Transaction Dialog -->
  <Dialog
    v-model:open="showForm"
    :title="formMode === 'add' ? 'Add Transaction' : 'Edit Transaction'"
    description="Enter transaction details below."
  >
    <Form class="mt-4" @submit="saveTransaction">
      <Input v-model="formName" label="Name" required />
      <Input v-model="formAmount" label="Amount" type="number" required />
      <Select v-model="formType" :options="transactionTypeOptions" label="Type" required />
      <div class="space-y-2">
        <Select
          v-model="formCategoryId"
          :options="formCategoryOptions"
          label="Category"
          searchable
          required
        />
        <div class="text-right">
          <button
            type="button"
            class="text-xs uppercase tracking-widest underline"
            @click="openCategoryDialog"
          >
            Manage categories
          </button>
        </div>
      </div>
      <DatePicker v-model="formDate" label="Date" required />

      <Button type="submit" :text="saveButtonText" class="w-full mt-4" />
    </Form>
  </Dialog>

  <!-- Manage Categories Dialog -->
  <Dialog
    v-model:open="categoryDialogOpen"
    title="Manage Categories"
    description="Add or edit your transaction categories."
    @close="closeCategoryDialog"
  >
    <Form class="mt-4 border-b border-[var(--text-base)] pb-6 mb-6" @submit="saveCategory">
      <Input v-model="categoryName" label="Name" required />
      <Checkbox v-model="categoryIsIncome" label="Income category" />
      <div class="flex gap-2 mt-4">
        <Button type="submit" :text="categoryButtonText" class="flex-1" />
        <Button
          v-if="editingCategoryId"
          type="button"
          text="Cancel"
          @click="resetCategoryForm"
          class="flex-1"
        />
      </div>
    </Form>

    <div class="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
      <div
        v-if="availableCategories.length === 0"
        class="text-xs uppercase tracking-widest text-center py-4"
      >
        No categories found.
      </div>
      <div
        v-for="category in availableCategories"
        :key="category.id"
        class="flex items-center justify-between border border-[var(--text-base)] px-3 py-2 text-xs"
      >
        <div>
          <div class="uppercase tracking-widest">{{ category.name }}</div>
          <div class="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            {{ category.is_income ? "Income" : "Expense" }}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="uppercase tracking-widest underline"
            @click="startEditCategory(category.id)"
          >
            Edit
          </button>
          <button
            type="button"
            class="uppercase tracking-widest underline"
            @click="requestDeleteCategory(category.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </Dialog>

  <ConfirmationDialog
    v-model:open="confirmOpen"
    :title="confirmTitle"
    :description="confirmDescription"
    :variant="confirmVariant"
    :loading="confirmLoading"
    confirm-text="Delete"
    @confirm="handleConfirmAction"
  />
</template>
