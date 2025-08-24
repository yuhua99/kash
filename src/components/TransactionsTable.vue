<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Edit, Trash2, MoreHorizontal } from 'lucide-vue-next'
import AddTransactionDialog from './AddTransactionDialog.vue'

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

interface Emits {
  (e: 'deleteTransaction', id: string): void
  (e: 'editTransaction', transaction: Transaction): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

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

const getCategoryVariant = (
  category: string,
): 'default' | 'destructive' | 'outline' | 'secondary' => {
  const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    Food: 'default',
    Utilities: 'secondary',
    Transportation: 'outline',
    Income: 'default',
    Entertainment: 'secondary',
    Healthcare: 'outline',
    Shopping: 'default',
  }
  return variants[category] || 'default'
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Transactions</CardTitle>
      <p class="text-sm text-muted-foreground">
        {{ transactions.length }} transaction{{ transactions.length !== 1 ? 's' : '' }}
      </p>
    </CardHeader>
    <CardContent>
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
          <TableRow v-for="transaction in transactions" :key="transaction.id">
            <TableCell class="font-mono text-sm">
              {{ new Date(transaction.date).toLocaleDateString() }}
            </TableCell>
            <TableCell class="font-medium">
              {{ transaction.description }}
            </TableCell>
            <TableCell>
              <Badge :variant="getCategoryVariant(transaction.category)">
                {{ transaction.category }}
              </Badge>
            </TableCell>
            <TableCell class="text-right font-mono">
              <span
                :class="[
                  'font-semibold',
                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600',
                ]"
              >
                {{ transaction.amount > 0 ? '+' : '' }}${{
                  Math.abs(transaction.amount).toFixed(2)
                }}
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
                    class="text-red-600 focus:text-red-600"
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

      <div v-if="transactions.length === 0" class="text-center py-8">
        <p class="text-muted-foreground">No transactions found</p>
        <p class="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    </CardContent>

    <!-- Edit Transaction Dialog -->
    <AddTransactionDialog
      v-model:open="editDialogOpen"
      :edit-transaction="editingTransaction"
      @edit-transaction="handleEditTransaction"
    />
  </Card>
</template>
