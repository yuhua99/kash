<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
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
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import CategorySelect from '@/components/categories/CategorySelect.vue'
import { useFormValidation } from '@/composables/useFormValidation'
import { useTransactionHelpers } from '@/composables/useTransactionHelpers'
import { useCategoriesStore } from '@/stores/categories'
import type { TransactionFormData, Transaction } from '@/types'
import { formatDate } from '@/lib/formatters'
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
const { suggestName } = useTransactionHelpers()
const categoriesStore = useCategoriesStore()

const isEditMode = computed(() => props.transaction !== null && props.transaction !== undefined)

const defaultFormData: TransactionFormData = {
  id: '',
  name: '',
  amount: '',
  category: '',
  type: TransactionType.EXPENSE,
  date: new Date(),
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
      date: new Date(transaction.timestamp * 1000),
    }
  } else {
    formData.value = {
      ...defaultFormData,
      date: new Date(),
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

const suggestedNames = ref<string[]>([])

const debouncedUpdateSuggestions = useDebounceFn(() => {
  suggestedNames.value = suggestName(formData.value.amount, formData.value.category)
}, 300)

watch(
  () => [formData.value.amount, formData.value.category],
  () => {
    debouncedUpdateSuggestions()
  },
  { immediate: true },
)

const isFormValid = computed(() => {
  return transactionValidation.isValidTransactionForm({
    name: formData.value.name,
    amount: formData.value.amount,
    category: formData.value.category,
  })
})

const maxDate = new Date()

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
    timestamp: Math.floor(formData.value.date.getTime() / 1000),
    timeStr: formatDate(Math.floor(formData.value.date.getTime() / 1000)),
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
        <SelectTrigger class="w-full">
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
      <CategorySelect v-model="formData.category" :filter-type="formData.type" />
    </div>

    <div class="space-y-2">
      <Label for="date">Date</Label>
      <DatePicker v-model="formData.date" :max-value="maxDate" />
    </div>

    <div class="space-y-2">
      <Label for="name">Description</Label>
      <Input id="name" v-model="formData.name" placeholder="Transaction description" />
      <div v-if="suggestedNames.length > 0" class="flex flex-wrap gap-2">
        <Badge
          v-for="suggestion in suggestedNames"
          :key="suggestion"
          variant="secondary"
          class="cursor-pointer hover:bg-secondary/80"
          @click="formData.name = suggestion"
        >
          {{ suggestion }}
        </Badge>
      </div>
    </div>

    <div v-if="showActions" class="flex justify-end gap-2 pt-4">
      <Button variant="outline" @click="handleCancel">Cancel</Button>
      <Button @click="handleSubmit" :disabled="!isFormValid">
        {{ isEditMode ? 'Save Changes' : 'Save' }}
      </Button>
    </div>
  </div>
</template>
