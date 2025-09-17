<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100]

const props = withDefaults(
  defineProps<{
    page: number
    pageCount: number
    pageSize: number
    totalItems: number
    disabled?: boolean
    showPageSizeSelector?: boolean
  }>(),
  {
    disabled: false,
    showPageSizeSelector: true,
  },
)

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:pageSize', value: number): void
}>()

const safePageCount = computed(() => Math.max(1, props.pageCount))
const currentPage = computed(() => Math.min(Math.max(props.page, 1), safePageCount.value))

const pageSizeOptions = computed(() => {
  if (!DEFAULT_PAGE_SIZE_OPTIONS.includes(props.pageSize)) {
    return [...DEFAULT_PAGE_SIZE_OPTIONS, props.pageSize].sort((a, b) => a - b)
  }
  return DEFAULT_PAGE_SIZE_OPTIONS
})

const canGoPrevious = computed(() => !props.disabled && currentPage.value > 1)
const canGoNext = computed(() => !props.disabled && currentPage.value < safePageCount.value)

const firstItem = computed(() => {
  if (props.totalItems === 0) return 0
  return (currentPage.value - 1) * props.pageSize + 1
})

const lastItem = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.min(props.totalItems, currentPage.value * props.pageSize)
})

const goToPage = (value: number) => {
  if (props.disabled) return
  const next = Math.min(Math.max(1, value), safePageCount.value)
  if (next === currentPage.value) return
  emit('update:page', next)
}

const changePageSize = (value: number) => {
  if (props.disabled || value <= 0) return
  if (value === props.pageSize) return
  emit('update:pageSize', value)
}
</script>

<template>
  <div class="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="text-sm text-muted-foreground">
      <span v-if="totalItems > 0">
        Showing <span class="font-medium">{{ firstItem }}</span> –
        <span class="font-medium">{{ lastItem }}</span> of
        <span class="font-medium">{{ totalItems }}</span>
      </span>
      <span v-else>No records to display</span>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div
        v-if="props.showPageSizeSelector"
        class="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <span>Rows per page</span>
        <Select
          :model-value="`${props.pageSize}`"
          :disabled="props.disabled"
          @update:model-value="(value) => changePageSize(Number(value))"
        >
          <SelectTrigger class="h-8 w-[90px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem v-for="option in pageSizeOptions" :key="option" :value="`${option}`">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex items-center gap-3 text-sm text-muted-foreground">
        Page {{ currentPage }} / {{ safePageCount }}
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          class="h-8 px-3"
          :disabled="!canGoPrevious"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          class="h-8 px-3"
          :disabled="!canGoNext"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>
