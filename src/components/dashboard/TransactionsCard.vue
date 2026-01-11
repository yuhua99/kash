<script setup lang="ts">
import type { Transaction } from "@/types"
import { formatSignedCurrency } from "@/lib/formatters"

defineProps<{
  transactions: Transaction[]
  mode: "overview" | "expanded"
}>()

const emit = defineEmits<{
  expand: []
  collapse: []
}>()
</script>

<template>
  <div
    class="bg-white border border-black flex flex-col p-8 md:col-span-2 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:row-end-3"
    :class="{
      'h-64 lg:translate-y-[17rem]': mode === 'overview',
      'h-[33rem] lg:translate-y-0': mode === 'expanded',
    }"
  >
    <div class="flex justify-between items-start mb-4 shrink-0">
      <span class="font-mono text-xs uppercase tracking-widest border border-black px-2 py-1">
        Latest Activity
      </span>
      <button
        v-if="mode === 'overview'"
        class="font-mono text-xs underline hover:text-gray-600"
        @click="emit('expand')"
      >
        VIEW ALL
      </button>
      <button
        v-else
        class="font-mono text-xs underline hover:text-gray-600"
        @click="emit('collapse')"
      >
        BACK
      </button>
    </div>

    <div v-if="transactions.length > 0" class="flex-1 overflow-y-auto space-y-3 min-h-0">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="flex justify-between items-end border-b border-gray-200 pb-2"
      >
        <div>
          <div class="font-bold text-sm">{{ transaction.name }}</div>
          <div class="font-mono text-xs text-[var(--text-muted)]">
            {{ transaction.category }}
          </div>
        </div>
        <div class="font-mono text-sm">{{ formatSignedCurrency(transaction.amount) }}</div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center min-h-0">
      <p class="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
        No recent transactions
      </p>
    </div>
  </div>
</template>
