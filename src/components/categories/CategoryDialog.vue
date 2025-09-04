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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionType } from '@/types'
import { useCategoriesStore } from '@/stores/categories'
import { useDialog } from '@/composables/useDialog'

const categoriesStore = useCategoriesStore()

interface Category {
  id: string
  name: string
  is_income: boolean
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
  is_income: false,
})

const resetForm = () => {
  categoryForm.value = {
    name: '',
    is_income: false,
  }
}

const { isOpen, editItem, isEditMode, setupExternalControl } = useDialog<Category>({
  onOpen: (category) => {
    if (category) {
      categoryForm.value = {
        name: category.name,
        is_income: category.is_income,
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

  if (isEditMode.value && editItem.value) {
    // For edit mode, only update the name (is_income cannot be modified per API)
    const categoryData = {
      name: categoryForm.value.name.trim(),
    }
    const success = await categoriesStore.updateCategory(editItem.value.id, categoryData)
    if (success) {
      emit('categorySaved', {
        ...categoryData,
        id: editItem.value.id,
        is_income: editItem.value.is_income,
      })
    }
  } else {
    // For create mode, include is_income
    const categoryData = {
      name: categoryForm.value.name.trim(),
      is_income: categoryForm.value.is_income,
    }
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

const categoryType = computed({
  get: () => (categoryForm.value.is_income ? TransactionType.INCOME : TransactionType.EXPENSE),
  set: (val: TransactionType) => {
    categoryForm.value.is_income = val === TransactionType.INCOME
  },
})
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
            :class="categoriesStore.error ? 'border-destructive' : ''"
          />
        </div>

        <!-- Only show type select for create mode -->
        <div v-if="!isEditMode" class="space-y-2">
          <Label for="category-type">Category Type</Label>
          <Select v-model="categoryType">
            <SelectTrigger id="category-type" class="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="TransactionType.EXPENSE">Expense</SelectItem>
              <SelectItem :value="TransactionType.INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Show read-only type for edit mode -->
        <div v-else class="grid gap-2">
          <Label>Category Type</Label>
          <p class="text-sm text-muted-foreground">
            {{ editItem?.is_income ? 'Income category' : 'Expense category' }} (cannot be changed)
          </p>
        </div>

        <p v-if="categoriesStore.error" class="text-sm text-destructive">
          {{ categoriesStore.error }}
        </p>
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
