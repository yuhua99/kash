<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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

const isEditMode = computed(() => props.editCategory !== null && props.editCategory !== undefined)
const dialogTitle = computed(() => (isEditMode.value ? 'Edit Category' : 'Add New Category'))
const dialogDescription = computed(() =>
  isEditMode.value
    ? 'Update the name of your category.'
    : 'Create a new category for organizing your transactions.',
)
const submitButtonText = computed(() => (isEditMode.value ? 'Save Changes' : 'Add Category'))

const showDialog = ref(false)
const categoryForm = ref({
  name: '',
})

const resetForm = () => {
  categoryForm.value = {
    name: '',
  }
}

// Watch for external open prop changes
watch(
  () => props.open,
  (newValue) => {
    if (newValue !== undefined) {
      showDialog.value = newValue
      // If opening in edit mode, make sure form is populated
      if (newValue && props.editCategory) {
        categoryForm.value = {
          name: props.editCategory.name,
        }
      }
    }
  },
  { immediate: true },
)

// Watch for edit category changes and populate form
watch(
  () => props.editCategory,
  (editCategory) => {
    if (editCategory) {
      categoryForm.value = {
        name: editCategory.name,
      }
    } else {
      // Reset form for add mode
      resetForm()
    }
  },
  { immediate: true },
)

// Watch showDialog changes and emit to parent
watch(showDialog, (newValue) => {
  if (props.open !== undefined) {
    emit('update:open', newValue)
  }
})

const handleSubmit = async () => {
  if (!categoryForm.value.name.trim()) return

  const categoryData = {
    name: categoryForm.value.name.trim(),
  }

  if (isEditMode.value && props.editCategory) {
    const success = await categoriesStore.updateCategory(props.editCategory.id, categoryData)
    if (success) {
      emit('categorySaved', { ...categoryData, id: props.editCategory.id })
    }
  } else {
    const newCategory = await categoriesStore.createCategory(categoryData)
    if (newCategory) {
      emit('categorySaved', newCategory)
    }
  }

  // Reset form and close dialog only if operation was successful
  if (!categoriesStore.error) {
    resetForm()
    showDialog.value = false
  }
}

const handleCancel = () => {
  resetForm()
  showDialog.value = false
}
</script>

<template>
  <Dialog v-model:open="showDialog">
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
