<script setup lang="ts">
import Block from "@/components/Block.vue"
import type { MonthExpenseData } from "@/composables/dashboard/useAnalyticsData"

defineProps<{
  data: MonthExpenseData[]
  label: string
}>()
</script>

<template>
  <Block label="Analytics" class="lg:col-start-3 lg:row-start-2">
    <div class="flex-1 flex flex-col justify-end overflow-hidden">
      <div class="flex items-end gap-2 h-32">
        <div
          v-for="(month, index) in data"
          :key="month.month"
          class="flex-1 bg-current"
          :style="{ height: `${month.heightPercent || 10}%` }"
          :class="index < data.length - 1 ? 'opacity-50' : ''"
        ></div>
      </div>
      <p class="font-mono text-xs text-center border-t border-black pt-2 mt-3 shrink-0">
        {{ label }}
      </p>
    </div>
  </Block>
</template>
