<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCategoriesStore } from '@/stores/categories'
import { Plus, CalendarIcon } from 'lucide-vue-next'

interface Transaction {
  description: string
  amount: number
  category: string
  date: string
  type: 'income' | 'expense'
}

const emit = defineEmits<{
  addTransaction: [transaction: Omit<Transaction, 'id'>]
}>()

const categoriesStore = useCategoriesStore()
const isOpen = ref(false)

// Form state
const form = ref({
  amount: '',
  type: 'expense' as 'income' | 'expense',
  category: '',
  date: new Date(),
  description: '',
})

// Calendar state
const isCalendarOpen = ref(false)

const formattedDate = computed(() => {
  return form.value.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

const resetForm = () => {
  form.value = {
    amount: '',
    type: 'expense',
    category: '',
    date: new Date(),
    description: '',
  }
}

const handleSubmit = () => {
  const amount = parseFloat(form.value.amount)
  if (!amount || !form.value.category || !form.value.description) return

  const transaction = {
    description: form.value.description,
    amount: form.value.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    category: form.value.category,
    date: form.value.date.toISOString().split('T')[0],
    type: form.value.type,
  }

  emit('addTransaction', transaction)
  resetForm()
  isOpen.value = false
}

const handleDateSelect = (date: Date | undefined) => {
  if (date) {
    form.value.date = date
    isCalendarOpen.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button
        size="icon"
        class="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <Plus class="h-6 w-6" />
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Quick Add Transaction</DialogTitle>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <!-- Amount -->
        <div class="space-y-2">
          <Label for="amount">Amount</Label>
          <Input id="amount" v-model="form.amount" type="number" step="0.01" placeholder="0.00" />
        </div>

        <!-- Type -->
        <div class="space-y-2">
          <Label>Type</Label>
          <Select v-model="form.type">
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Category -->
        <div class="space-y-2">
          <Label>Category</Label>
          <Select v-model="form.category">
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

        <!-- Date -->
        <div class="space-y-2">
          <Label>Date</Label>
          <Popover v-model:open="isCalendarOpen">
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full justify-start text-left font-normal">
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ formattedDate }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                :model-value="form.date"
                @update:model-value="handleDateSelect"
                initial-focus
              />
            </PopoverContent>
          </Popover>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <Label for="description">Description</Label>
          <Input
            id="description"
            v-model="form.description"
            placeholder="Transaction description"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button variant="outline" @click="isOpen = false">Cancel</Button>
          <Button
            @click="handleSubmit"
            :disabled="!form.amount || !form.category || !form.description"
          >
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
