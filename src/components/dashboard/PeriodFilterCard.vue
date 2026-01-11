<script setup lang="ts">
import Block from "@/components/Block.vue"
import { Select } from "@/components/ui"
import { formatCurrency } from "@/lib/formatters"
import { PeriodUnit } from "@/types"
import type { FinancialSummary } from "@/composables/useFinancialCalculations"

const props = defineProps<{
  selectedPeriod: PeriodUnit
  summary: FinancialSummary
}>()

const emit = defineEmits<{
  "update:selectedPeriod": [value: PeriodUnit]
}>()

const periodOptions = [
  { label: "Month", value: PeriodUnit.MONTH },
  { label: "Half year", value: PeriodUnit.HALF_YEAR },
  { label: "Year", value: PeriodUnit.YEAR },
]

function handleUpdate(value: PeriodUnit) {
  emit("update:selectedPeriod", value)
}
</script>

<template>
  <Block label="Time Period" class="lg:col-start-3 lg:row-start-1">
    <div class="flex-1 flex flex-col justify-center overflow-hidden">
      <Select
        :model-value="selectedPeriod"
        :options="periodOptions"
        class="w-full mb-4"
        @update:model-value="handleUpdate"
      />
      <div class="space-y-2">
        <div class="flex justify-between font-mono text-xs">
          <span>Income:</span>
          <span class="text-green-600">{{ formatCurrency(summary.totalIncome) }}</span>
        </div>
        <div class="flex justify-between font-mono text-xs">
          <span>Expenses:</span>
          <span class="text-red-600">{{ formatCurrency(summary.totalExpenses) }}</span>
        </div>
        <div class="flex justify-between font-mono text-sm font-bold border-t border-black pt-2">
          <span>Net:</span>
          <span>{{ formatCurrency(summary.netIncome) }}</span>
        </div>
      </div>
    </div>
  </Block>
</template>
