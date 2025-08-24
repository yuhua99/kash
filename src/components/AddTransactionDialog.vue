<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

interface TransactionBase {
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
}

interface TransactionWithId extends TransactionBase {
  id: string
}

interface Props {
  editTransaction?: TransactionWithId | null
  open?: boolean
}

interface Emits {
  (e: 'addTransaction', transaction: TransactionBase): void
  (e: 'editTransaction', transaction: TransactionWithId): void
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditMode = computed(
  () => props.editTransaction !== null && props.editTransaction !== undefined,
)
const dialogTitle = computed(() => (isEditMode.value ? 'Edit Transaction' : 'Add New Transaction'))
const dialogDescription = computed(() =>
  isEditMode.value
    ? 'Update the details of your transaction.'
    : 'Add a new income or expense transaction to your budget.',
)
const submitButtonText = computed(() => (isEditMode.value ? 'Save Changes' : 'Add Transaction'))

const showDialog = ref(false)
const transactionForm = ref({
  description: '',
  amount: '',
  category: '',
  type: 'expense' as 'income' | 'expense',
  date: new Date().toISOString().split('T')[0],
})

const resetForm = () => {
  transactionForm.value = {
    description: '',
    amount: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  }
}

// Watch for external open prop changes
watch(
  () => props.open,
  (newValue) => {
    if (newValue !== undefined) {
      showDialog.value = newValue
    }
  },
)

// Watch for edit transaction changes and populate form
watch(
  () => props.editTransaction,
  (editTransaction) => {
    if (editTransaction) {
      transactionForm.value = {
        description: editTransaction.description,
        amount: Math.abs(editTransaction.amount).toString(),
        category: editTransaction.category,
        type: editTransaction.type,
        date: editTransaction.date,
      }
    } else {
      // Reset form for add mode
      resetForm()
    }
  },
  { immediate: true },
)

// Watch showDialog changes and emit to parent
watch(showDialog, (newValue) => {
  if (props.open !== undefined) {
    emit('update:open', newValue)
  }
})

const handleSubmit = () => {
  const amount = parseFloat(transactionForm.value.amount)
  if (!amount || !transactionForm.value.description || !transactionForm.value.category) return

  const transaction = {
    description: transactionForm.value.description,
    amount: transactionForm.value.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    category: transactionForm.value.category,
    type: transactionForm.value.type,
    date: transactionForm.value.date,
  }

  if (isEditMode.value && props.editTransaction) {
    emit('editTransaction', { ...transaction, id: props.editTransaction.id! })
  } else {
    emit('addTransaction', transaction)
  }

  // Reset form and close dialog
  resetForm()
  showDialog.value = false
}

const handleCancel = () => {
  resetForm()
  showDialog.value = false
}
</script>

<template>
  <Dialog v-model:open="showDialog">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>
          {{ dialogDescription }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="description">Description</Label>
          <Input
            id="description"
            v-model="transactionForm.description"
            placeholder="Transaction description"
          />
        </div>
        <div class="grid gap-2">
          <Label for="amount">Amount</Label>
          <Input
            id="amount"
            v-model="transactionForm.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <div class="grid gap-2">
          <Label for="category">Category</Label>
          <Select v-model="transactionForm.category">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="category in categoriesStore.categories"
                :key="category.id"
                :value="category.name"
              >
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="type">Type</Label>
          <Select v-model="transactionForm.type">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="date">Date</Label>
          <Input id="date" v-model="transactionForm.date" type="date" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel"> Cancel </Button>
        <Button @click="handleSubmit">{{ submitButtonText }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
