<script setup lang="ts">
import { ref, computed } from 'vue'
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
import type { Transaction } from '@/types'
import { useDialog } from '@/composables/useDialog'

interface Props {
  editTransaction?: Transaction | null
  open?: boolean
}

interface Emits {
  (e: 'addTransaction', transaction: Transaction): void
  (e: 'editTransaction', transaction: Transaction): void
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const transactionFormRef = ref<InstanceType<typeof TransactionForm>>()

const { isOpen, isEditMode, setupExternalControl } = useDialog<Transaction>({
  onClose: () => {
    transactionFormRef.value?.resetForm()
  },
})

// Setup external prop synchronization
setupExternalControl(
  () => props.open,
  () => props.editTransaction,
  (event, value) => emit(event, value),
)

const dialogTitle = computed(() => (isEditMode.value ? 'Edit Transaction' : 'Add New Transaction'))
const dialogDescription = computed(() =>
  isEditMode.value
    ? 'Update the details of your transaction.'
    : 'Add a new income or expense transaction to your budget.',
)
const submitButtonText = computed(() => (isEditMode.value ? 'Save Changes' : 'Add Transaction'))

const handleSubmit = () => {
  transactionFormRef.value?.handleSubmit()
}

const handleAddTransaction = (transaction: Transaction) => {
  emit('addTransaction', transaction)
  isOpen.value = false
}

const handleUpdateTransaction = (transaction: Transaction) => {
  emit('editTransaction', transaction)
  isOpen.value = false
}

const handleCancel = () => {
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
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
          mode="full"
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
