<script setup lang="ts">
import Block from "@/components/Block.vue"
import { formatCurrency } from "@/lib/formatters"

defineProps<{
  balance: number
  currency?: string
}>()
</script>

<template>
  <Block label="Balance" class="lg:col-start-1 lg:row-start-1">
    <template #headerRight>
      <span class="font-mono text-xs">{{ currency || "USD" }}</span>
    </template>
    <div class="flex-1 flex flex-col justify-end overflow-hidden">
      <h2 class="text-5xl font-bold tracking-tighter mb-2">
        {{ formatCurrency(balance) }}
      </h2>
      <p class="font-mono text-xs text-[var(--text-muted)]">Current Month</p>
    </div>
  </Block>
</template>
