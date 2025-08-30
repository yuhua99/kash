<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-vue-next'
import CategoryDialog from '@/components/categories/CategoryDialog.vue'

interface Props {
  title?: string
}

interface Emits {
  (e: 'category-saved', category: { id: string; name: string }): void
}

withDefaults(defineProps<Props>(), {
  title: 'Categories',
})

defineEmits<Emits>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-2">
      <CategoryDialog @category-saved="$emit('category-saved', $event)">
        <Button size="sm">
          <Plus class="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </CategoryDialog>
    </div>
  </div>
</template>
