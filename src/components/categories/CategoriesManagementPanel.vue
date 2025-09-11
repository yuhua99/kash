<script setup lang="ts">
import { computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CategoryDialog from '@/components/categories/CategoryDialog.vue'
import { Search, MoreHorizontal, Edit, Trash2, Plus } from 'lucide-vue-next'
import type { Category } from '@/types/category'

import { useCategoriesStore } from '@/stores/categories'

const props = defineProps<{
  categories: Category[]
  searchQuery: string
  isSearching?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'edit', category: Category): void
  (e: 'delete', id: string): void
  (e: 'category-saved'): void
}>()

const hasNoCategories = computed(() => props.categories.length === 0)

const onCategorySaved = () => emit('category-saved')

const categoriesStore = useCategoriesStore()
</script>

<template>
  <!-- Search Bar -->
  <div class="relative mb-4">
    <Search
      class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
    />
    <Input
      :model-value="props.searchQuery"
      @update:modelValue="(val) => emit('update:searchQuery', val as string)"
      placeholder="Search categories..."
      class="pl-10"
    />
  </div>

  <div v-if="hasNoCategories" class="text-center py-8">
    <template v-if="props.isSearching">
      <p class="text-muted-foreground">No categories match your search</p>
    </template>
    <template v-else>
      <p class="text-muted-foreground mb-4">No categories found</p>
      <CategoryDialog @category-saved="onCategorySaved">
        <Button variant="outline">
          <Plus class="h-4 w-4 mr-2" />
          Create your first category
        </Button>
      </CategoryDialog>
    </template>
  </div>

  <div v-else class="space-y-2">
    <div
      v-for="category in props.categories"
      :key="category.id"
      class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-4 h-4 rounded-full border border-border flex-shrink-0"
          :style="{ backgroundColor: categoriesStore.getCategoryColor(category.id) }"
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
          <DropdownMenuItem @click="emit('edit', category)">
            <Edit class="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            @click="emit('delete', category.id)"
            class="text-destructive focus:text-destructive"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
