<script setup lang="ts">
import { computed } from 'vue'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategoriesStore } from '@/stores/categories'

interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const categoriesStore = useCategoriesStore()

const isDarkMode = computed(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
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
</template>
