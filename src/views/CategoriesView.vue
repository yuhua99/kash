<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import CategoryHeader from '@/components/categories/CategoryHeader.vue'
import CategoryDialog from '@/components/categories/CategoryDialog.vue'
import CategoriesLoadingSkeleton from '@/components/categories/CategoriesLoadingSkeleton.vue'
import CategoriesManagementPanel from '@/components/categories/CategoriesManagementPanel.vue'
import CategoryStatsTable from '@/components/categories/CategoryStatsTable.vue'
import { useAuthStore } from '@/stores/auth'
import { useCategoriesStore } from '@/stores/categories'
import { useRecordsStore } from '@/stores/records'
import FloatingButton from '@/components/common/FloatingButton.vue'
import { Plus } from 'lucide-vue-next'
// formatting handled inside child components

const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()
const recordsStore = useRecordsStore()

// Search functionality
const searchQuery = ref('')

const isLoading = computed(
  () => authStore.isLoading || categoriesStore.isLoading || recordsStore.isLoading,
)

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
    }
  })

  return stats.sort((a, b) => b.totalSpent - a.totalSpent)
})

// Dialog state
const editDialogCategory = ref<{ id: string; name: string; is_income: boolean } | null>(null)
const showEditDialog = ref(false)

const handleEditCategory = (category: { id: string; name: string; is_income: boolean }) => {
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
    <CategoryHeader />

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <CategoriesLoadingSkeleton />
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
            <CategoriesManagementPanel
              :categories="filteredCategories"
              :get-category-color="categoriesStore.getCategoryColor"
              v-model:searchQuery="searchQuery"
              :is-searching="searchQuery.trim().length > 0"
              @edit="handleEditCategory"
              @delete="handleDeleteCategory"
              @category-saved="onCategorySaved"
            />
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
            <CategoryStatsTable
              :stats="categoryStats"
              :get-category-color="categoriesStore.getCategoryColor"
            />
          </CardContent>
        </Card>
      </div>

      <CategoryDialog @category-saved="onCategorySaved">
        <FloatingButton aria-label="Add category">
          <Plus class="h-6 w-6" />
        </FloatingButton>
      </CategoryDialog>
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
