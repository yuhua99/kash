<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/lib/formatters'

interface TooltipData {
  name: string
  color: string
  value: number
}

interface Props {
  title?: string
  data: TooltipData[]
}

const props = defineProps<Props>()

// Calculate net amount
const netAmount = computed(() => {
  const income = props.data.find((item) => item.name === 'income')?.value || 0
  const expenses = props.data.find((item) => item.name === 'expenses')?.value || 0
  return income - expenses
})
</script>

<template>
  <div
    class="bg-popover text-popover-foreground border rounded-md shadow-sm text-xs p-2 min-w-[180px]"
  >
    <div v-if="title" class="text-muted-foreground text-[11px] mb-1 font-medium">
      {{ title }}
    </div>
    <div class="flex flex-col gap-1">
      <div v-for="item in data" :key="item.name" class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <div
            class="w-2 h-2 rounded-full flex-shrink-0"
            :style="{ backgroundColor: item.color }"
          />
          <span class="capitalize">{{ item.name }}</span>
        </div>
        <span class="font-medium tabular-nums">{{ formatCurrency(item.value) }}</span>
      </div>

      <div
        v-if="data.length > 1"
        class="flex items-center justify-between pt-2 mt-2 border-t border-border/50"
      >
        <span class="text-muted-foreground text-[11px]">Net</span>
        <span
          :class="[
            'font-semibold tabular-nums text-[11px]',
            netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600',
          ]"
        >
          {{ formatCurrency(netAmount) }}
        </span>
      </div>
    </div>
  </div>
</template>
