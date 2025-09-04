<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, Trash2, MoreHorizontal, Calendar, Tag as TagIcon } from 'lucide-vue-next'
import AddTransactionDialog from './AddTransactionDialog.vue'
import { useCategoriesStore } from '@/stores/categories'
import { formatDate } from '@/lib/formatters'
import type { Transaction } from '@/types'
import { formatSignedCurrency } from '@/lib/formatters'

interface Props {
  transactions: Transaction[]
}

interface Emits {
  (e: 'deleteTransaction', id: string): void
  (e: 'editTransaction', transaction: Transaction): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
const categoriesStore = useCategoriesStore()

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

// Simplify badge styling; color dot already conveys category
</script>

<template>
  <div>
    <!-- Mobile: Card list -->
    <div class="md:hidden space-y-2">
      <DropdownMenu v-for="transaction in transactions" :key="transaction.id">
        <DropdownMenuTrigger as-child>
          <div
            class="rounded-lg border p-3 bg-background border-l-4 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors"
            :style="{
              borderLeftColor: (categoriesStore.getCategoryId(transaction.category)
                ? categoriesStore.getCategoryColor(
                    categoriesStore.getCategoryId(transaction.category) as string,
                  )
                : 'var(--border)') as string,
            }"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="font-medium break-words leading-tight">{{ transaction.name }}</div>
                  <div class="text-right font-mono whitespace-nowrap leading-tight">
                    <span
                      :class="[
                        'font-semibold text-base',
                        transaction.amount > 0
                          ? 'text-[hsl(var(--vis-secondary-color))]'
                          : 'text-[hsl(var(--vis-primary-color))]',
                      ]"
                    >
                      {{ formatSignedCurrency(transaction.amount) }}
                    </span>
                  </div>
                </div>
                <div
                  class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
                >
                  <div class="flex items-center gap-1">
                    <Calendar class="h-3 w-3" />
                    <span class="font-mono">{{ formatDate(transaction.timestamp) }}</span>
                  </div>
                  <div class="flex items-center min-w-0">
                    <div class="flex items-center min-w-0">
                      <Badge variant="secondary" class="max-w-full truncate">
                        {{ transaction.category }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="openEditDialog(transaction)">
            <Edit class="h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            class="text-destructive focus:text-destructive"
            @click="$emit('deleteTransaction', transaction.id)"
          >
            <Trash2 class="h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Desktop: Table -->
    <div class="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead class="text-right">Amount</TableHead>
            <TableHead class="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="transaction in transactions"
            :key="transaction.id"
            class="hover:bg-muted/50"
          >
            <TableCell class="font-mono text-sm">{{ formatDate(transaction.timestamp) }}</TableCell>
            <TableCell class="font-medium">
              {{ transaction.name }}
            </TableCell>
            <TableCell>
              <div class="flex items-center space-x-2">
                <div
                  class="w-3 h-3 rounded-full border border-border flex-shrink-0"
                  :style="{
                    backgroundColor: (categoriesStore.getCategoryId(transaction.category)
                      ? categoriesStore.getCategoryColor(
                          categoriesStore.getCategoryId(transaction.category) as string,
                        )
                      : 'var(--muted)') as string,
                  }"
                ></div>
                <Badge variant="secondary">
                  {{ transaction.category }}
                </Badge>
              </div>
            </TableCell>
            <TableCell class="text-right font-mono">
              <span
                :class="[
                  'font-semibold',
                  transaction.amount > 0
                    ? 'text-[hsl(var(--vis-secondary-color))]'
                    : 'text-[hsl(var(--vis-primary-color))]',
                ]"
              >
                {{ formatSignedCurrency(transaction.amount) }}
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" class="h-8 w-8 p-0">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEditDialog(transaction)">
                    <Edit class="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="$emit('deleteTransaction', transaction.id)"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Empty State -->
    <div v-if="transactions.length === 0" class="text-center py-12 border-t">
      <div class="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
        <MoreHorizontal class="h-8 w-8 text-muted-foreground" />
      </div>
      <p class="text-muted-foreground text-lg font-medium mb-2">No transactions found</p>
      <p class="text-sm text-muted-foreground">
        Try adjusting your search or filters, or add your first transaction
      </p>
    </div>

    <!-- Edit Transaction Dialog -->
    <AddTransactionDialog
      v-model:open="editDialogOpen"
      :edit-transaction="editingTransaction"
      @edit-transaction="handleEditTransaction"
    />
  </div>
</template>
