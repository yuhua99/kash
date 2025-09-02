<script setup lang="ts">
interface Props {
  title?: string | number
  data: {
    name: string
    color: string
    value: string | number
  }[]
}

defineProps<Props>()

import { formatCurrency } from '@/lib/formatters'

// Normalize incoming value (may be string or number from chart)
const toNumber = (value: number | string): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}
</script>

<template>
  <div v-if="data && data.length > 0" class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-2 min-w-0">
      <span class="w-3 h-3 flex-shrink-0">
        <svg width="100%" height="100%" viewBox="0 0 30 30">
          <circle cx="15" cy="15" r="6" :fill="data[0].color" />
        </svg>
      </span>
      <span class="font-medium truncate">
        {{ data[0].name }}
      </span>
    </div>
    <span class="font-semibold whitespace-nowrap">
      {{ formatCurrency(toNumber(title || 0)) }}
    </span>
  </div>
</template>
