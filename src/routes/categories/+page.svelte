<script lang="ts">
  import { goto } from '$app/navigation'
  import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
  } from '$lib/features/categories/api'
  import {
    getCategoriesCached,
    invalidateCategoriesCache,
    setCategoriesCache,
  } from '$lib/features/categories/cache'
  import { toast } from '$lib/ui/toast'
  import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
  import CategoryEditDialog from '$lib/features/categories/components/CategoryEditDialog.svelte'
  import CategoryForm from '$lib/features/categories/components/CategoryForm.svelte'
  import CategoryList from '$lib/features/categories/components/CategoryList.svelte'
  import type { Category } from '$lib/core/domain/models'
  import { validateCategoryName } from '$lib/shared/validation'
  import type { PageData } from './$types'

  type ApiError = Error & { status?: number }
  type CategoriesPageData = PageData & { categories: Category[]; loadError?: string }

  export let data: CategoriesPageData

  let categories: Category[] = data.categories
  let loading = false
  let loadError = data.loadError ?? ''

  let createName = ''
  let createType: 'expense' | 'income' = 'expense'
  let createNameError = ''
  let creating = false

  let editingId: string | null = null
  let editName = ''
  let editNameError = ''
  let editDialogOpen = false
  let savingEdit = false
  let deletingId: string | null = null
  let pendingDeleteCategory: Category | null = null
  let deleteDialogOpen = false
  let activeActionRowId: string | null = null

  $: editingCategoryName = categories.find((category) => category.id === editingId)?.name ?? ''

  $: incomeCategories = categories.filter((category) => category.is_income)
  $: expenseCategories = categories.filter((category) => !category.is_income)

  $: if (data) {
    categories = data.categories
    loadError = data.loadError ?? ''
    loading = false
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage
  }

  function onCreateTypeChange(nextValue: string): void {
    if (nextValue === 'income' || nextValue === 'expense') {
      createType = nextValue
    }
  }

  function toggleRowActions(categoryId: string): void {
    activeActionRowId = activeActionRowId === categoryId ? null : categoryId
  }

  function onRowShellClick(event: MouseEvent, categoryId: string): void {
    const target = event.target
    if (target instanceof HTMLElement && target.closest('.row-action-panel')) {
      return
    }

    toggleRowActions(categoryId)
  }

  function onMainClick(event: MouseEvent): void {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    if (target.closest('[data-action-row-shell]')) {
      return
    }

    activeActionRowId = null
  }

  function onRowShellKeydown(event: KeyboardEvent, categoryId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    toggleRowActions(categoryId)
  }

  async function fetchCategories(forceRefresh = false): Promise<void> {
    loading = true
    loadError = ''

    try {
      if (forceRefresh) {
        const response = await getCategories({ limit: 1000, offset: 0 })
        categories = response.categories
        setCategoriesCache(response.categories)
      } else {
        categories = await getCategoriesCached()
      }
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      loadError = getErrorMessage(error, 'Unable to load categories.')
    } finally {
      loading = false
    }
  }

  async function onCreateSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    createNameError = ''

    const normalizedName = createName.trim()
    const validation = validateCategoryName(normalizedName)
    if (validation) {
      createNameError = validation
      return
    }

    creating = true
    try {
      const isIncome = createType === 'income'
      await createCategory({ name: normalizedName, is_income: isIncome })
      invalidateCategoriesCache()
      createName = ''
      toast.success('Category created.')
      await fetchCategories(true)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to create category.'))
    } finally {
      creating = false
    }
  }

  function startEdit(category: Category): void {
    activeActionRowId = null
    editingId = category.id
    editName = category.name
    editNameError = ''
    editDialogOpen = true
  }

  function cancelEdit(): void {
    editDialogOpen = false
    editingId = null
    editName = ''
    editNameError = ''
  }

  function onEditDialogOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      editDialogOpen = true
      return
    }

    cancelEdit()
  }

  async function saveEdit(): Promise<void> {
    if (!editingId) {
      return
    }
    editNameError = ''

    const normalizedName = editName.trim()
    const validation = validateCategoryName(normalizedName)
    if (validation) {
      editNameError = validation
      return
    }

    savingEdit = true
    try {
      await updateCategory(editingId, { name: normalizedName })
      invalidateCategoriesCache()
      cancelEdit()
      toast.success('Category updated.')
      await fetchCategories(true)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to update category.'))
    } finally {
      savingEdit = false
    }
  }

  function requestDeleteCategory(category: Category): void {
    activeActionRowId = null
    if (deletingId) {
      return
    }
    pendingDeleteCategory = category
    deleteDialogOpen = true
  }

  function closeDeleteDialog(): void {
    deleteDialogOpen = false
    pendingDeleteCategory = null
  }

  function onDeleteDialogOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      deleteDialogOpen = true
      return
    }

    if (deletingId) {
      deleteDialogOpen = true
      return
    }

    closeDeleteDialog()
  }

  async function confirmDeleteCategory(): Promise<void> {
    if (!pendingDeleteCategory) {
      return
    }

    const category = pendingDeleteCategory

    deletingId = category.id

    try {
      await deleteCategory(category.id)
      invalidateCategoriesCache()
      if (editingId === category.id) {
        cancelEdit()
      }
      closeDeleteDialog()
      toast.success('Category deleted.')
      await fetchCategories(true)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to delete category.'))
    } finally {
      deletingId = null
    }
  }
</script>

<svelte:window on:click={onMainClick} />

<main>
  <CategoryForm
    bind:createName
    {createNameError}
    {createType}
    {creating}
    {onCreateSubmit}
    {onCreateTypeChange}
  />

  <CategoryList
    {loading}
    {loadError}
    {categories}
    {incomeCategories}
    {expenseCategories}
    {activeActionRowId}
    {deletingId}
    {onRowShellClick}
    {onRowShellKeydown}
    {startEdit}
    {requestDeleteCategory}
  />

  {#if !loading && !loadError && categories.length > 0}
    <CategoryEditDialog
      {editDialogOpen}
      {onEditDialogOpenChange}
      {editingCategoryName}
      bind:editName
      {editNameError}
      {saveEdit}
      {cancelEdit}
      {savingEdit}
    />

    <ConfirmDialog
      open={deleteDialogOpen}
      onOpenChange={onDeleteDialogOpenChange}
      title="Delete category"
      description={pendingDeleteCategory
        ? `Delete category "${pendingDeleteCategory.name}"? This cannot be undone.`
        : 'Delete selected category? This cannot be undone.'}
      confirmLabel="Delete"
      confirmBusyLabel="Deleting..."
      busy={deletingId === pendingDeleteCategory?.id}
      onConfirm={confirmDeleteCategory}
    />
  {/if}
</main>
