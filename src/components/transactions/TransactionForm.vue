<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import CategorySelect from '@/components/categories/CategorySelect.vue'
import { useFormValidation } from '@/composables/useFormValidation'

export interface TransactionFormData {
  name: string
  amount: string
  category: string
  type: 'income' | 'expense'
  date: string
}

export interface TransactionBase {
  name: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
}

export interface TransactionWithId extends TransactionBase {
  id: string
}

interface Props {
  transaction?: TransactionWithId | null
  modelValue?: TransactionFormData
  mode?: 'full' | 'quick'
  showActions?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: TransactionFormData): void
  (e: 'submit', transaction: TransactionBase): void
  (e: 'update', transaction: TransactionWithId): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'full',
  showActions: false,
})
const emit = defineEmits<Emits>()

const { transactionValidation } = useFormValidation()

const isEditMode = computed(() => props.transaction !== null && props.transaction !== undefined)
const isQuickMode = computed(() => props.mode === 'quick')

const defaultFormData: TransactionFormData = {
  name: '',
  amount: '',
  category: '',
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
}

const formData = ref<TransactionFormData>({ ...defaultFormData })

// Watch for transaction prop changes and populate form
watch(
  () => props.transaction,
  (transaction) => {
    if (transaction) {
      formData.value = {
        name: transaction.name,
        amount: Math.abs(transaction.amount).toString(),
        category: transaction.category,
        type: transaction.type,
        date: transaction.date,
      }
    } else {
      formData.value = {
        ...defaultFormData,
        date: new Date().toISOString().split('T')[0],
      }
    }
    emit('update:modelValue', formData.value)
  },
  { immediate: true },
)

// Watch for external form data changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== formData.value) {
      formData.value = { ...newValue }
    }
  },
  { deep: true },
)

// Watch form data changes and emit updates
watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true },
)

const resetForm = () => {
  formData.value = {
    ...defaultFormData,
    date: new Date().toISOString().split('T')[0],
  }
  emit('update:modelValue', formData.value)
}

const isFormValid = computed(() => {
  return transactionValidation.isValidTransactionForm({
    name: formData.value.name,
    amount: formData.value.amount,
    category: formData.value.category,
  })
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  const amount = parseFloat(formData.value.amount)
  const transaction = {
    name: formData.value.name,
    amount: formData.value.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    category: formData.value.category,
    type: formData.value.type,
    date: formData.value.date as string,
  }

  if (isEditMode.value && props.transaction) {
    emit('update', { ...transaction, id: props.transaction.id })
  } else {
    emit('submit', transaction)
  }
}

const handleCancel = () => {
  emit('cancel')
}

defineExpose({
  resetForm,
  handleSubmit,
  isFormValid,
})
</script>

<template>
  <div :class="isQuickMode ? 'space-y-4' : 'grid gap-4'">
    <!-- Amount -->
    <div :class="isQuickMode ? 'space-y-2' : 'grid gap-2'">
      <Label for="amount">Amount</Label>
      <Input id="amount" v-model="formData.amount" type="number" step="0.01" placeholder="0.00" />
    </div>

    <!-- Type -->
    <div :class="isQuickMode ? 'space-y-2' : 'grid gap-2'">
      <Label for="type">Type</Label>
      <Select v-model="formData.type">
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Category -->
    <div :class="isQuickMode ? 'space-y-2' : 'grid gap-2'">
      <Label for="category">Category</Label>
      <CategorySelect v-model="formData.category" />
    </div>

    <!-- Date -->
    <div :class="isQuickMode ? 'space-y-2' : 'grid gap-2'">
      <Label for="date">Date</Label>
      <Input id="date" v-model="formData.date" type="date" />
    </div>

    <!-- Description -->
    <div :class="isQuickMode ? 'space-y-2' : 'grid gap-2'">
      <Label for="name">Description</Label>
      <Input id="name" v-model="formData.name" placeholder="Transaction description" />
    </div>

    <!-- Actions (for quick mode or when showActions is true) -->
    <div v-if="showActions" :class="isQuickMode ? 'flex justify-end gap-2 pt-4' : 'flex gap-2'">
      <Button variant="outline" @click="handleCancel">Cancel</Button>
      <Button @click="handleSubmit" :disabled="!isFormValid">
        {{ isEditMode ? 'Save Changes' : 'Save' }}
      </Button>
    </div>
  </div>
</template>
