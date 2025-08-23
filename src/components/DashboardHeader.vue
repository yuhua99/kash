<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Filter } from 'lucide-vue-next'
import AddTransactionDialog from './AddTransactionDialog.vue'

interface Props {
  searchQuery: string
  selectedCategory: string
  categories: string[]
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedCategory', value: string): void
  (e: 'addTransaction', transaction: any): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Budget Dashboard</h1>
      <p class="text-muted-foreground">Track your income and expenses</p>
    </div>

    <div class="flex items-center gap-4">
      <!-- Search -->
      <div class="relative">
        <Input
          :model-value="searchQuery"
          @update:model-value="$emit('update:searchQuery', $event)"
          placeholder="Search transactions..."
          class="w-64"
        />
      </div>

      <!-- Category Filter -->
      <Select
        :model-value="selectedCategory"
        @update:model-value="$emit('update:selectedCategory', $event)"
      >
        <SelectTrigger class="w-48">
          <Filter class="h-4 w-4 mr-2" />
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Add Transaction Dialog -->
      <AddTransactionDialog
        :categories="categories"
        @add-transaction="$emit('addTransaction', $event)"
      >
        <Button>
          <Plus class="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </AddTransactionDialog>
    </div>
  </div>
</template>

