<script setup lang="ts">
import { computed } from 'vue'

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

import { formatCurrency } from '@/lib/formatters'
</script>

<template>
  <div class="text-sm min-w-[160px]">
    <!-- Period title -->
    <div v-if="title" class="text-xs text-muted-foreground mb-2 font-medium">
      {{ title }}
    </div>

    <!-- Values -->
    <div class="space-y-1">
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

      <!-- Net Amount -->
      <div
        v-if="data.length > 1"
        class="flex items-center justify-between pt-1 mt-1 border-t border-border/50"
      >
        <span class="text-muted-foreground text-xs">Net</span>
        <span
          :class="[
            'font-semibold tabular-nums text-xs',
            netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600',
          ]"
        >
          {{ formatCurrency(netAmount) }}
        </span>
      </div>
    </div>
  </div>
</template>
