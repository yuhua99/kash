<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Edit, Trash2, Plus } from 'lucide-vue-next'
import CategoryDialog from './CategoryDialog.vue'
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

const editDialogCategory = ref<{ id: string; name: string } | null>(null)
const showEditDialog = ref(false)
const showAddDialog = ref(false)

const isDarkMode = computed(() => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

onMounted(() => {
  if (categoriesStore.categories.length === 0) {
    categoriesStore.fetchCategories()
  }
})

const handleEditCategory = (category: { id: string; name: string }) => {
  editDialogCategory.value = category
  showEditDialog.value = true
}

const handleDeleteCategory = async (categoryId: string) => {
  if (confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
    await categoriesStore.deleteCategory(categoryId)
  }
}

const onCategorySaved = (savedCategory: { id: string; name: string }) => {
  showEditDialog.value = false
  showAddDialog.value = false
  editDialogCategory.value = null
  console.log('Category saved successfully:', savedCategory)
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription> Manage your transaction categories </CardDescription>
        </div>
        <CategoryDialog v-model:open="showAddDialog" @category-saved="onCategorySaved">
          <Button>
            <Plus class="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </CategoryDialog>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="categoriesStore.isLoading" class="flex items-center justify-center py-8">
        <p class="text-muted-foreground">Loading categories...</p>
      </div>

      <div v-else-if="categoriesStore.error" class="text-center py-8">
        <p class="text-red-600 mb-4">{{ categoriesStore.error }}</p>
        <Button variant="outline" @click="categoriesStore.fetchCategories()"> Retry </Button>
      </div>

      <div v-else-if="categoriesStore.categories.length === 0" class="text-center py-8">
        <p class="text-muted-foreground mb-4">No categories found</p>
        <CategoryDialog v-model:open="showAddDialog" @category-saved="onCategorySaved">
          <Button variant="outline">
            <Plus class="h-4 w-4 mr-2" />
            Create your first category
          </Button>
        </CategoryDialog>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="category in categoriesStore.categories"
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

  <!-- Edit Category Dialog -->
  <CategoryDialog
    v-if="editDialogCategory"
    :edit-category="editDialogCategory"
    v-model:open="showEditDialog"
    @category-saved="onCategorySaved"
  />
</template>
