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
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

const isDarkMode = computed(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

interface TransactionFormData {
  name: string
  amount: string
  category: string
  type: 'income' | 'expense'
  date: string
}

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
  transaction?: TransactionWithId | null
  modelValue?: TransactionFormData
}

interface Emits {
  (e: 'update:modelValue', value: TransactionFormData): void
  (e: 'submit', transaction: TransactionBase): void
  (e: 'update', transaction: TransactionWithId): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditMode = computed(() => props.transaction !== null && props.transaction !== undefined)

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
      formData.value = { ...defaultFormData }
    }
    emit('update:modelValue', formData.value)
  },
  { immediate: true }
)

// Watch for external form data changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && newValue !== formData.value) {
      formData.value = { ...newValue }
    }
  },
  { deep: true }
)

// Watch form data changes and emit updates
watch(
  formData,
  (newValue) => {
    emit('update:modelValue', newValue)
  },
  { deep: true }
)

const resetForm = () => {
  formData.value = { ...defaultFormData }
  emit('update:modelValue', formData.value)
}

const isFormValid = computed(() => {
  const amount = parseFloat(formData.value.amount)
  return !!(amount && formData.value.name && formData.value.category)
})

const handleSubmit = () => {
  if (!isFormValid.value) return

  const amount = parseFloat(formData.value.amount)
  const transaction = {
    name: formData.value.name,
    amount: formData.value.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    category: formData.value.category,
    type: formData.value.type,
    date: formData.value.date,
  }

  if (isEditMode.value && props.transaction) {
    emit('update', { ...transaction, id: props.transaction.id })
  } else {
    emit('submit', transaction)
  }
}

defineExpose({
  resetForm,
  handleSubmit,
  isFormValid,
})
</script>

<template>
  <div class="grid gap-4">
    <div class="grid gap-2">
      <Label for="name">Description</Label>
      <Input
        id="name"
        v-model="formData.name"
        placeholder="Transaction description"
      />
    </div>
    <div class="grid gap-2">
      <Label for="amount">Amount</Label>
      <Input
        id="amount"
        v-model="formData.amount"
        type="number"
        step="0.01"
        placeholder="0.00"
      />
    </div>
    <div class="grid gap-2">
      <Label for="category">Category</Label>
      <Select v-model="formData.category">
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="category in categoriesStore.categories"
            :key="category.id"
            :value="category.name"
          >
            <div class="flex items-center space-x-2">
              <div
                class="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                :style="{
                  backgroundColor: categoriesStore.getCategoryColor(category.id, isDarkMode),
                }"
              ></div>
              <span>{{ category.name }}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="grid gap-2">
      <Label for="type">Type</Label>
      <Select v-model="formData.type">
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
      <Input id="date" v-model="formData.date" type="date" />
    </div>
  </div>
</template>