<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/ui/data-table'
import type { DataTableColumn } from '@/components/ui/data-table'
import { Edit, Trash2, MoreHorizontal } from 'lucide-vue-next'
import AddTransactionDialog from './AddTransactionDialog.vue'
import MobileTransactionsList from './MobileTransactionsList.vue'
import { useCategoriesStore } from '@/stores/categories'
import { useGlobalStore } from '@/stores/global'
import type { Transaction } from '@/types'
import { formatSignedCurrency } from '@/lib/formatters'

interface Props {
  transactions: Transaction[]
  totalTransactions: number
}

interface Emits {
  (e: 'deleteTransaction', id: string): void
  (e: 'editTransaction', transaction: Transaction): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const categoriesStore = useCategoriesStore()
const global = useGlobalStore()

const editDialogOpen = ref(false)
const editingTransaction = ref<Transaction | null>(null)

const openEditDialog = (transaction: Transaction) => {
  editingTransaction.value = transaction
  editDialogOpen.value = true
}

const handleEditTransaction = (transaction: Transaction) => {
  editingTransaction.value = null
  emit('editTransaction', transaction)
}

const handleDeleteTransaction = (id: string) => {
  emit('deleteTransaction', id)
}

const page = ref(1)

const columns: DataTableColumn<Transaction>[] = [
  {
    key: 'timeStr',
    label: 'Date',
    cellClass: 'font-mono text-sm',
    width: 'w-[8rem]',
  },
  {
    key: 'category',
    label: 'Category',
    width: 'w-[12rem]',
  },
  {
    key: 'name',
    label: 'Description',
    cellClass: 'font-medium',
  },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    cellClass: 'font-mono',
    width: 'w-[8rem]',
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'center',
    width: 'w-[100px]',
  },
]
</script>

<template>
  <div>
    <MobileTransactionsList
      v-if="global.isMobile"
      :transactions="props.transactions"
      @delete-transaction="(id: string) => handleDeleteTransaction(id)"
      @open-edit="openEditDialog"
    />

    <template v-else>
      <DataTable
        v-model:page="page"
        :items="props.transactions"
        :columns="columns"
        :total-items="props.totalTransactions"
        :show-page-size-selector="false"
        row-key="id"
      >
        <template #cell-category="{ row }">
          <div class="flex items-center gap-2">
            <div
              class="h-3 w-3 flex-shrink-0 rounded-full border border-border"
              :style="{ backgroundColor: categoriesStore.getCategoryColor(row.category_id) }"
            />
            <Badge variant="secondary">
              {{ row.category }}
            </Badge>
          </div>
        </template>

        <template #cell-name="{ row }">
          <span class="font-medium">{{ row.name }}</span>
        </template>

        <template #cell-amount="{ row }">
          <span
            :class="[
              'font-semibold font-mono',
              row.amount > 0
                ? 'text-[hsl(var(--vis-secondary-color))]'
                : 'text-[hsl(var(--vis-primary-color))]',
            ]"
          >
            {{ formatSignedCurrency(row.amount) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="h-8 w-8 p-0">
                <MoreHorizontal class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="openEditDialog(row)">
                <Edit class="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive focus:text-destructive"
                @click="handleDeleteTransaction(row.id)"
              >
                <Trash2 class="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <div
              class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted"
            >
              <MoreHorizontal class="h-8 w-8 text-muted-foreground" />
            </div>
            <p class="text-lg font-medium text-muted-foreground">No transactions found</p>
            <p class="text-sm text-muted-foreground">
              Try adjusting your search or filters, or add your first transaction
            </p>
          </div>
        </template>
      </DataTable>
    </template>

    <AddTransactionDialog
      v-model:open="editDialogOpen"
      :edit-transaction="editingTransaction"
      @edit-transaction="handleEditTransaction"
    />
  </div>
</template>
