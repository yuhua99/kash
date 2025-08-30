<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CategoryHeader from '@/components/categories/CategoryHeader.vue'
import CategoryDialog from '@/components/categories/CategoryDialog.vue'
import { Search, MoreHorizontal, Edit, Trash2, Plus } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { useRecordsStore } from '@/stores/records'

const router = useRouter()
const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const recordsStore = useRecordsStore()

// Search functionality
const searchQuery = ref('')

const isLoading = computed(
  () => authStore.isLoading || categoriesStore.isLoading || recordsStore.isLoading,
)

const isDarkMode = computed(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

// Filter categories based on search
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) {
    return categoriesStore.categories
  }

  const query = searchQuery.value.toLowerCase().trim()
  return categoriesStore.categories.filter((category) =>
    category.name.toLowerCase().includes(query),
  )
})

// Category statistics
const categoryStats = computed(() => {
  const stats = filteredCategories.value.map((category) => {
    const categoryTransactions = recordsStore.transactions.filter(
      (t) => t.category === category.name,
    )
    const totalTransactions = categoryTransactions.length
    const totalSpent = categoryTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const totalIncome = categoryTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      ...category,
      transactionCount: totalTransactions,
      totalSpent,
      totalIncome,
      netAmount: totalIncome - totalSpent,
    }
  })

  return stats.sort((a, b) => b.totalSpent - a.totalSpent)
})

// Dialog state
const editDialogCategory = ref<{ id: string; name: string } | null>(null)
const showEditDialog = ref(false)

const handleEditCategory = (category: { id: string; name: string }) => {
  editDialogCategory.value = category
  showEditDialog.value = true
}

const handleDeleteCategory = async (categoryId: string) => {
  if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
    await categoriesStore.deleteCategory(categoryId)
  }
}

const onCategorySaved = () => {
  showEditDialog.value = false
  editDialogCategory.value = null
}

const loadData = async () => {
  const isAuthenticated = await authStore.checkAuthStatus()

  if (!isAuthenticated) {
    console.warn('User not authenticated, redirecting to login')
    router.push('/login')
    return
  }

  await categoriesStore.fetchCategories()
  await recordsStore.fetchRecords()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <CategoryHeader @category-saved="onCategorySaved" />

    <!-- Error State -->
    <div
      v-if="authStore.error || categoriesStore.error || recordsStore.error"
      class="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded"
    >
      <p v-if="authStore.error">Authentication Error: {{ authStore.error }}</p>
      <p v-if="categoriesStore.error">Categories Error: {{ categoriesStore.error }}</p>
      <p v-if="recordsStore.error">Records Error: {{ recordsStore.error }}</p>
      <div class="mt-2 space-x-2">
        <button
          @click="(authStore.clearError(), categoriesStore.clearError(), recordsStore.clearError())"
          class="text-red-700 underline text-sm"
        >
          Dismiss
        </button>
        <button @click="loadData" class="text-red-700 underline text-sm">Retry</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <!-- Header skeleton -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-32 mb-2" />
            <Skeleton class="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton class="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton class="h-6 w-32 mb-2" />
            <Skeleton class="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div v-for="i in 5" :key="i" class="flex items-center space-x-3">
                <Skeleton class="h-8 w-8 rounded-full" />
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-4 w-16 ml-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="authStore.isAuthenticated" class="space-y-6">
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Category Management -->
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>Add, edit, and organize your categories</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <!-- Search Bar -->
            <div class="relative mb-4">
              <Search
                class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input v-model="searchQuery" placeholder="Search categories..." class="pl-10" />
            </div>

            <div v-if="categoriesStore.categories.length === 0" class="text-center py-8">
              <p class="text-muted-foreground mb-4">No categories found</p>
              <CategoryDialog @category-saved="onCategorySaved">
                <Button variant="outline">
                  <Plus class="h-4 w-4 mr-2" />
                  Create your first category
                </Button>
              </CategoryDialog>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="category in filteredCategories"
                :key="category.id"
                class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    :style="{
                      backgroundColor: categoriesStore.getCategoryColor(category.id, isDarkMode),
                    }"
                  ></div>
                  <Badge variant="secondary">{{ category.name }}</Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="handleEditCategory(category)">
                      <Edit class="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="handleDeleteCategory(category.id)"
                      class="text-red-600 focus:text-red-600"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Detailed Category Statistics -->
        <Card>
          <CardHeader>
            <CardTitle>Category Statistics</CardTitle>
            <CardDescription>
              Detailed breakdown showing transaction counts and amounts per category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead class="text-right">Count</TableHead>
                  <TableHead class="text-right">Spent</TableHead>
                  <TableHead class="text-right">Income</TableHead>
                  <TableHead class="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="stat in categoryStats" :key="stat.id" class="hover:bg-muted/50">
                  <TableCell>
                    <div class="flex items-center space-x-2">
                      <div
                        class="w-3 h-3 rounded-full flex-shrink-0"
                        :style="{
                          backgroundColor: categoriesStore.getCategoryColor(stat.id, isDarkMode),
                        }"
                      ></div>
                      <span class="font-medium text-sm">{{ stat.name }}</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right text-sm">{{ stat.transactionCount }}</TableCell>
                  <TableCell class="text-right text-red-600 text-sm">
                    {{ stat.totalSpent > 0 ? '-$' + stat.totalSpent.toFixed(0) : '$0' }}
                  </TableCell>
                  <TableCell class="text-right text-green-600 text-sm">
                    {{ stat.totalIncome > 0 ? '+$' + stat.totalIncome.toFixed(0) : '$0' }}
                  </TableCell>
                  <TableCell
                    class="text-right font-medium text-sm"
                    :class="stat.netAmount >= 0 ? 'text-green-600' : 'text-red-600'"
                  >
                    {{ stat.netAmount >= 0 ? '+' : '' }}${{ stat.netAmount.toFixed(0) }}
                  </TableCell>
                </TableRow>
                <TableRow v-if="categoryStats.length === 0">
                  <TableCell colspan="5" class="text-center text-muted-foreground py-6 text-sm">
                    No categories found
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Edit Category Dialog -->
    <CategoryDialog
      v-if="editDialogCategory"
      :edit-category="editDialogCategory"
      v-model:open="showEditDialog"
      @category-saved="onCategorySaved"
    />
  </div>
</template>
