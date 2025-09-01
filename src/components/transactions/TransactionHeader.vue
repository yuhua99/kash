<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-vue-next'
import AddTransactionDialog from '@/components/transactions/AddTransactionDialog.vue'
import type { TransactionBase } from '@/types'

interface Props {
  title?: string
}

interface Emits {
  (e: 'add-transaction', transaction: TransactionBase): void
  (e: 'export-transactions'): void
}

withDefaults(defineProps<Props>(), {
  title: 'Transactions',
})

defineEmits<Emits>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" @click="$emit('export-transactions')">
        <Download class="h-4 w-4 mr-2" />
        Export
      </Button>
      <AddTransactionDialog @add-transaction="$emit('add-transaction', $event)">
        <Button size="sm">
          <Plus class="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </AddTransactionDialog>
    </div>
  </div>
</template>
