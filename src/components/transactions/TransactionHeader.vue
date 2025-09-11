<script setup lang="ts">
import PeriodRangeSelector from '@/components/transactions/PeriodRangeSelector.vue'

interface Props {
  title?: string
}

type Range = { start: number; end: number }

withDefaults(defineProps<Props>(), {
  title: 'Transactions',
})

const emit = defineEmits<{ (e: 'range-change', range: Range): void }>()

const onRangeChange = (range: Range) => emit('range-change', range)
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
    </div>
    <div class="flex-shrink-0">
      <PeriodRangeSelector @range-change="onRangeChange" />
    </div>
  </div>
</template>
