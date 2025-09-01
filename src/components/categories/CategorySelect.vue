<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategoriesStore } from '@/stores/categories'
import { TransactionType } from '@/types'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  filterType: TransactionType
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const categoriesStore = useCategoriesStore()

const isDarkMode = computed(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

const categories = computed(() => {
  return props.filterType === TransactionType.INCOME
    ? categoriesStore.incomeCategories
    : categoriesStore.expenseCategories
})

const handleValueChange = (value: unknown) => {
  if (typeof value === 'string') {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <Select :model-value="modelValue" @update:model-value="handleValueChange" :disabled="disabled">
    <SelectTrigger>
      <SelectValue :placeholder="placeholder || 'Select category'" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup v-if="categories.length > 0">
        <SelectItem v-for="category in categories" :key="category.id" :value="category.name">
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
      </SelectGroup>
    </SelectContent>
  </Select>
</template>
