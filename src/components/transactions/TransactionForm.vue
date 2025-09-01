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
import { Button } from '@/components/ui/button'
import CategorySelect from '@/components/categories/CategorySelect.vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { useCategoriesStore } from '@/stores/categories'
import type { TransactionFormData, Transaction } from '@/types'
import { TransactionType } from '@/types'

interface Props {
  transaction?: Transaction | null
  modelValue?: TransactionFormData
  showActions?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: TransactionFormData): void
  (e: 'submit', transaction: Transaction): void
  (e: 'update', transaction: Transaction): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
})
const emit = defineEmits<Emits>()

const { transactionValidation } = useFormValidation()
const categoriesStore = useCategoriesStore()

const isEditMode = computed(() => props.transaction !== null && props.transaction !== undefined)
const categoryFilterType = computed(() =>
  formData.value.type === TransactionType.INCOME ? TransactionType.INCOME : TransactionType.EXPENSE,
)

const defaultFormData: TransactionFormData = {
  id: '',
  name: '',
  amount: '',
  category: '',
  type: TransactionType.EXPENSE,
  date: new Date().toISOString().split('T')[0],
}

const formData = ref<TransactionFormData>({ ...defaultFormData })

const initializeFormData = (transaction?: Transaction | null) => {
  if (transaction && transaction.id) {
    formData.value = {
      id: transaction.id,
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
}

const clearIncompatibleCategory = (newType: TransactionType, oldType: TransactionType) => {
  if (newType !== oldType && formData.value.category) {
    const category = categoriesStore.categories.find((cat) => cat.name === formData.value.category)
    if (category && (newType === TransactionType.INCOME) !== category.is_income) {
      formData.value.category = ''
    }
  }
}

watch(
  () => props.transaction,
  (transaction) => {
    initializeFormData(transaction)
    emit('update:modelValue', formData.value)
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData.value)) {
      formData.value = { ...newValue }
    }
  },
  { deep: true },
)

watch(() => formData.value.type, clearIncompatibleCategory)

watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true },
)

const isFormValid = computed(() => {
  return transactionValidation.isValidTransactionForm({
    name: formData.value.name,
    amount: formData.value.amount,
    category: formData.value.category,
  })
})

const resetForm = () => {
  initializeFormData()
  emit('update:modelValue', formData.value)
}

const handleSubmit = () => {
  if (!isFormValid.value) return

  const amount = parseFloat(formData.value.amount)
  const transaction: Transaction = {
    id: formData.value.id || '',
    name: formData.value.name,
    amount: formData.value.type === TransactionType.EXPENSE ? -Math.abs(amount) : Math.abs(amount),
    category: formData.value.category,
    type: formData.value.type,
    date: formData.value.date as string,
  }

  if (isEditMode.value && props.transaction?.id) {
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
  <div class="space-y-4">
    <div class="space-y-2">
      <Label for="amount">Amount</Label>
      <Input id="amount" v-model="formData.amount" type="number" step="0.01" placeholder="0.00" />
    </div>

    <div class="space-y-2">
      <Label for="type">Type</Label>
      <Select v-model="formData.type">
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="TransactionType.INCOME">Income</SelectItem>
          <SelectItem :value="TransactionType.EXPENSE">Expense</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-2">
      <Label for="category">Category</Label>
      <CategorySelect v-model="formData.category" :filter-type="categoryFilterType" />
    </div>

    <div class="space-y-2">
      <Label for="date">Date</Label>
      <Input id="date" v-model="formData.date" type="date" />
    </div>

    <div class="space-y-2">
      <Label for="name">Description</Label>
      <Input id="name" v-model="formData.name" placeholder="Transaction description" />
    </div>

    <div v-if="showActions" class="flex justify-end gap-2 pt-4">
      <Button variant="outline" @click="handleCancel">Cancel</Button>
      <Button @click="handleSubmit" :disabled="!isFormValid">
        {{ isEditMode ? 'Save Changes' : 'Save' }}
      </Button>
    </div>
  </div>
</template>
