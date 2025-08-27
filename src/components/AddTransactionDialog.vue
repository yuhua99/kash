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
import TransactionForm from './TransactionForm.vue'

interface TransactionBase {
  name: string
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
const transactionFormRef = ref<InstanceType<typeof TransactionForm>>()

// Watch for external open prop changes
watch(
  () => props.open,
  (newValue) => {
    if (newValue !== undefined) {
      showDialog.value = newValue
    }
  },
)

// Watch showDialog changes and emit to parent
watch(showDialog, (newValue) => {
  if (props.open !== undefined) {
    emit('update:open', newValue)
  }
})

const handleSubmit = () => {
  transactionFormRef.value?.handleSubmit()
}

const handleAddTransaction = (transaction: TransactionBase) => {
  emit('addTransaction', transaction)
  handleClose()
}

const handleUpdateTransaction = (transaction: TransactionWithId) => {
  emit('editTransaction', transaction)
  handleClose()
}

const handleClose = () => {
  transactionFormRef.value?.resetForm()
  showDialog.value = false
}

const handleCancel = () => {
  handleClose()
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
      <div class="py-4">
        <TransactionForm
          ref="transactionFormRef"
          :transaction="editTransaction"
          @submit="handleAddTransaction"
          @update="handleUpdateTransaction"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel"> Cancel </Button>
        <Button @click="handleSubmit">{{ submitButtonText }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
