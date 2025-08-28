<script setup lang="ts">
import { ref, computed } from 'vue'
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
import { useDialog } from '@/composables/useDialog'

const categoriesStore = useCategoriesStore()

interface Category {
  id: string
  name: string
}

interface Props {
  editCategory?: Category | null
  open?: boolean
}

interface Emits {
  (e: 'categorySaved', category: Category): void
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const categoryForm = ref({
  name: '',
})

const resetForm = () => {
  categoryForm.value = {
    name: '',
  }
}

const { isOpen, editItem, isEditMode, setupExternalControl } = useDialog<Category>({
  onOpen: (category) => {
    if (category) {
      categoryForm.value = {
        name: category.name,
      }
    } else {
      resetForm()
    }
  },
  onClose: resetForm,
})

// Setup external prop synchronization
setupExternalControl(
  () => props.open,
  () => props.editCategory,
  (event, value) => emit(event, value),
)

const dialogTitle = computed(() => (isEditMode.value ? 'Edit Category' : 'Add New Category'))
const dialogDescription = computed(() =>
  isEditMode.value
    ? 'Update the name of your category.'
    : 'Create a new category for organizing your transactions.',
)
const submitButtonText = computed(() => (isEditMode.value ? 'Save Changes' : 'Add Category'))

const handleSubmit = async () => {
  if (!categoryForm.value.name.trim()) return

  const categoryData = {
    name: categoryForm.value.name.trim(),
  }

  if (isEditMode.value && editItem.value) {
    const success = await categoriesStore.updateCategory(editItem.value.id, categoryData)
    if (success) {
      emit('categorySaved', { ...categoryData, id: editItem.value.id })
    }
  } else {
    const newCategory = await categoriesStore.createCategory(categoryData)
    if (newCategory) {
      emit('categorySaved', newCategory)
    }
  }

  // Reset form and close dialog only if operation was successful
  if (!categoriesStore.error) {
    isOpen.value = false
  }
}

const handleCancel = () => {
  isOpen.value = false
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger v-if="$slots.default" as-child>
      <slot />
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ dialogTitle }}</DialogTitle>
        <DialogDescription>
          {{ dialogDescription }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="category-name">Category Name</Label>
          <Input
            id="category-name"
            v-model="categoryForm.name"
            placeholder="Enter category name"
            :class="categoriesStore.error ? 'border-red-500' : ''"
          />
          <p v-if="categoriesStore.error" class="text-sm text-red-500">
            {{ categoriesStore.error }}
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel"> Cancel </Button>
        <Button
          @click="handleSubmit"
          :disabled="!categoryForm.name.trim() || categoriesStore.isLoading"
        >
          {{ categoriesStore.isLoading ? 'Saving...' : submitButtonText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
