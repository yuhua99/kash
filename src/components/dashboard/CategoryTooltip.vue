<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/lib/formatters'

interface Props {
  title?: string | number
  data: {
    name: string
    color: string
    value: string | number
  }[]
}

const props = defineProps<Props>()

// Normalize incoming value (may be string or number from chart)
const toNumber = (value: number | string): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''))
  return isNaN(parsed) ? 0 : parsed
}
// When DonutChart passes index = "name", ChartSingleTooltip
// sends title = category label and data[0].value = formatted amount.
// Support both that and the alternate path.
const label = computed(() => {
  const t = props.title
  if (typeof t === 'string' && t.length > 0) return t
  return (props.data?.[0]?.name as string) ?? ''
})
const amountText = computed(() => {
  const v = props.data?.[0]?.value
  if (typeof v === 'string') return v // already formatted by valueFormatter
  if (typeof v === 'number') return formatCurrency(v)
  // fallback to numeric title if it was provided as number/string
  return formatCurrency(toNumber((props.title ?? 0) as string | number))
})
</script>

<template>
  <div
    v-if="data && data.length > 0"
    class="bg-popover text-popover-foreground border rounded-md shadow-sm text-xs p-2 min-w-[180px]"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="w-2 h-2 flex-shrink-0">
          <svg width="100%" height="100%" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="6" :fill="data[0].color" />
          </svg>
        </span>
        <span class="font-medium truncate">{{ label }}</span>
      </div>
      <span class="font-medium tabular-nums whitespace-nowrap">{{ amountText }}</span>
    </div>
  </div>
</template>
