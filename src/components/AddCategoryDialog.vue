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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCategoriesStore } from '@/stores/categories'

const categoriesStore = useCategoriesStore()

const showDialog = ref(false)
const newCategory = ref({
  name: '',
})

const addCategory = async () => {
  if (!newCategory.value.name.trim()) return

  await categoriesStore.createCategory({
    name: newCategory.value.name.trim(),
  })

  // Reset form
  newCategory.value = {
    name: '',
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
        <DialogTitle>Add New Category</DialogTitle>
        <DialogDescription>
          Create a new category for organizing your transactions.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="category-name">Category Name</Label>
          <Input id="category-name" v-model="newCategory.name" placeholder="Enter category name" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showDialog = false"> Cancel </Button>
        <Button @click="addCategory" :disabled="!newCategory.name.trim()"> Add Category </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
