<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Filter, MoreHorizontal, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-vue-next'

// Enhanced transaction interface
interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
}

// Sample data with more realistic transactions
const transactions = ref<Transaction[]>([
  { id: '1', date: '2025-08-22', description: 'Grocery Store', amount: -85.32, category: 'Food', type: 'expense' },
  { id: '2', date: '2025-08-20', description: 'Salary Deposit', amount: 3500.00, category: 'Income', type: 'income' },
  { id: '3', date: '2025-08-19', description: 'Electric Bill', amount: -127.45, category: 'Utilities', type: 'expense' },
  { id: '4', date: '2025-08-18', description: 'Coffee Shop', amount: -12.50, category: 'Food', type: 'expense' },
  { id: '5', date: '2025-08-17', description: 'Gas Station', amount: -45.00, category: 'Transportation', type: 'expense' },
  { id: '6', date: '2025-08-16', description: 'Freelance Work', amount: 750.00, category: 'Income', type: 'income' },
  { id: '7', date: '2025-08-15', description: 'Restaurant', amount: -65.80, category: 'Food', type: 'expense' },
  { id: '8', date: '2025-08-14', description: 'Internet Bill', amount: -89.99, category: 'Utilities', type: 'expense' }
])

// Filter states
const selectedCategory = ref<string>('')
const searchQuery = ref('')
const showAddDialog = ref(false)

// New transaction form
const newTransaction = ref({
  description: '',
  amount: '',
  category: '',
  type: 'expense' as 'income' | 'expense',
  date: new Date().toISOString().split('T')[0]
})

// Categories
const categories = ['Food', 'Utilities', 'Transportation', 'Income', 'Entertainment', 'Healthcare', 'Shopping']

// Computed values
const totalBalance = computed(() => {
  return transactions.value.reduce((sum, t) => sum + t.amount, 0)
})

const monthlyIncome = computed(() => {
  return transactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const monthlyExpenses = computed(() => {
  return Math.abs(transactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0))
})

const savingsRate = computed(() => {
  return monthlyIncome.value > 0 ? ((monthlyIncome.value - monthlyExpenses.value) / monthlyIncome.value * 100) : 0
})

// Filtered transactions
const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    const matchesCategory = !selectedCategory.value || transaction.category === selectedCategory.value
    const matchesSearch = !searchQuery.value || 
      transaction.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCategory && matchesSearch
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// Functions
const addTransaction = () => {
  const amount = parseFloat(newTransaction.value.amount)
  if (!amount || !newTransaction.value.description || !newTransaction.value.category) return

  transactions.value.push({
    id: Date.now().toString(),
    date: newTransaction.value.date,
    description: newTransaction.value.description,
    amount: newTransaction.value.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
    category: newTransaction.value.category,
    type: newTransaction.value.type
  })

  // Reset form
  newTransaction.value = {
    description: '',
    amount: '',
    category: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  }
  showAddDialog.value = false
}

const deleteTransaction = (id: string) => {
  transactions.value = transactions.value.filter(t => t.id !== id)
}

const getCategoryVariant = (category: string) => {
  const variants: Record<string, string> = {
    'Food': 'default',
    'Utilities': 'secondary',
    'Transportation': 'outline',
    'Income': 'default',
    'Entertainment': 'secondary',
    'Healthcare': 'outline',
    'Shopping': 'default'
  }
  return variants[category] || 'default'
}
</script>

<template>
  <main class="p-6 space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Budget Dashboard</h1>
        <p class="text-muted-foreground">Track your income and expenses</p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Search -->
        <div class="relative">
          <Input
            v-model="searchQuery"
            placeholder="Search transactions..."
            class="w-64"
          />
        </div>
        
        <!-- Category Filter -->
        <Select v-model="selectedCategory">
          <SelectTrigger class="w-48">
            <Filter class="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </SelectItem>
          </SelectContent>
        </Select>

        <!-- Add Transaction Dialog -->
        <Dialog v-model:open="showAddDialog">
          <DialogTrigger as-child>
            <Button>
              <Plus class="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
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
                    <SelectItem v-for="category in categories" :key="category" :value="category">
                      {{ category }}
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
                <Input
                  id="date"
                  v-model="newTransaction.date"
                  type="date"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" @click="showAddDialog = false">
                Cancel
              </Button>
              <Button @click="addTransaction">
                Add Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Balance</CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">${{ totalBalance.toFixed(2) }}</div>
          <p class="text-xs text-muted-foreground">
            Current account balance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp class="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-600">${{ monthlyIncome.toFixed(2) }}</div>
          <p class="text-xs text-muted-foreground">
            Total income this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Monthly Expenses</CardTitle>
          <TrendingDown class="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-red-600">${{ monthlyExpenses.toFixed(2) }}</div>
          <p class="text-xs text-muted-foreground">
            Total expenses this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Savings Rate</CardTitle>
          <TrendingUp class="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-blue-600">{{ savingsRate.toFixed(1) }}%</div>
          <p class="text-xs text-muted-foreground">
            Of total income saved
          </p>
        </CardContent>
      </Card>
    </div>

    <Separator />

    <!-- Transactions Table -->
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ filteredTransactions.length }} transaction{{ filteredTransactions.length !== 1 ? 's' : '' }}
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead class="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="transaction in filteredTransactions" :key="transaction.id">
              <TableCell class="font-mono text-sm">
                {{ new Date(transaction.date).toLocaleDateString() }}
              </TableCell>
              <TableCell class="font-medium">
                {{ transaction.description }}
              </TableCell>
              <TableCell>
                <Badge :variant="getCategoryVariant(transaction.category)">
                  {{ transaction.category }}
                </Badge>
              </TableCell>
              <TableCell class="text-right font-mono">
                <span :class="['font-semibold', transaction.amount > 0 ? 'text-green-600' : 'text-red-600']">
                  {{ transaction.amount > 0 ? '+' : '' }}${{ Math.abs(transaction.amount).toFixed(2) }}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" class="h-8 w-8 p-0">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit class="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      class="text-red-600 focus:text-red-600" 
                      @click="deleteTransaction(transaction.id)"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <div v-if="filteredTransactions.length === 0" class="text-center py-8">
          <p class="text-muted-foreground">No transactions found</p>
          <p class="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      </CardContent>
    </Card>
  </main>
</template>
