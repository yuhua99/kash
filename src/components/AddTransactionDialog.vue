<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

// Props interface removed since we get categories from the store

interface Transaction {
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  date: string
}

interface Emits {
  (e: 'addTransaction', transaction: Transaction): void
}

const emit = defineEmits<Emits>()

const showDialog = ref(false)
const newTransaction = ref({
  description: '',
  amount: '',
  category: '',
  type: 'expense' as 'income' | 'expense',
  date: new Date().toISOString().split('T')[0],
})

const addTransaction = () => {
  const amount = parseFloat(newTransaction.value.amount)
  if (!amount || !newTransaction.value.description || !newTransaction.value.category) return

  const transaction: Transaction = {
    description: newTransaction.value.description,
    amount: newTransaction.value.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    category: newTransaction.value.category,
    type: newTransaction.value.type,
    date: newTransaction.value.date,
  }

  emit('addTransaction', transaction)

  // Reset form
  newTransaction.value = {
    description: '',
    amount: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
  }
  showDialog.value = false
}
</script>

<template>
  <Dialog v-model:open="showDialog">
    <DialogTrigger as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogDescription>
          Add a new income or expense transaction to your budget.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="description">Description</Label>
          <Input
            id="description"
            v-model="newTransaction.description"
            placeholder="Transaction description"
          />
        </div>
        <div class="grid gap-2">
          <Label for="amount">Amount</Label>
          <Input
            id="amount"
            v-model="newTransaction.amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        <div class="grid gap-2">
          <Label for="category">Category</Label>
          <Select v-model="newTransaction.category">
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="category in categoriesStore.categories"
                :key="category.id"
                :value="category.name"
              >
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="type">Type</Label>
          <Select v-model="newTransaction.type">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-2">
          <Label for="date">Date</Label>
          <Input id="date" v-model="newTransaction.date" type="date" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showDialog = false"> Cancel </Button>
        <Button @click="addTransaction"> Add Transaction </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
