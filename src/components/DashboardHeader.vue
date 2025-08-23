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
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

interface Props {
  searchQuery: string
  selectedCategory: string
}

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

interface Emits {
  (e: 'update:searchQuery', value: string): void
  (e: 'update:selectedCategory', value: string): void
  (e: 'addTransaction', transaction: Omit<Transaction, 'id'>): void
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
          @update:model-value="(value) => $emit('update:searchQuery', value as string)"
          placeholder="Search transactions..."
          class="w-64"
        />
      </div>

      <!-- Category Filter -->
      <Select
        :model-value="selectedCategory"
        @update:model-value="(value) => $emit('update:selectedCategory', value as string)"
      >
        <SelectTrigger class="w-48">
          <Filter class="h-4 w-4 mr-2" />
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem
            v-for="category in categoriesStore.categories"
            :key="category.id"
            :value="category.name"
          >
            {{ category.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <!-- Add Transaction Dialog -->
      <AddTransactionDialog @add-transaction="$emit('addTransaction', $event)">
        <Button>
          <Plus class="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </AddTransactionDialog>
    </div>
  </div>
</template>
