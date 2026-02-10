<script lang="ts">
  import { goto } from '$app/navigation'
  import { Button, Collapsible, Dialog, Tabs } from 'bits-ui'
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
  import ListRow from '$lib/components/ListRow.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import type { Category } from '$lib/core/domain/models'
  import { validateCategoryName, validateSearchTerm } from '$lib/shared/validation'
  import { onMount } from 'svelte'

  type ApiError = Error & { status?: number }

  let categories: Category[] = []
  let loading = true
  let loadError = ''
  let mutationError = ''
  let successMessage = ''

  let search = ''

  let createName = ''
  let createOpen = false
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

  $: searchValidationError = validateSearchTerm(search.trim()) ?? ''
  $: normalizedSearch = search.trim().toLowerCase()
  $: visibleCategories = categories.filter((category) =>
    normalizedSearch ? category.name.toLowerCase().includes(normalizedSearch) : true,
  )
  $: incomeCategories = visibleCategories.filter((category) => category.is_income)
  $: expenseCategories = visibleCategories.filter((category) => !category.is_income)

  function clearMutationFeedback(): void {
    mutationError = ''
    successMessage = ''
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
    clearMutationFeedback()
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
      successMessage = 'Category created.'
      await fetchCategories(true)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      mutationError = getErrorMessage(error, 'Unable to create category.')
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
    clearMutationFeedback()
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

    clearMutationFeedback()
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
      successMessage = 'Category updated.'
      await fetchCategories(true)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      mutationError = getErrorMessage(error, 'Unable to update category.')
    } finally {
      savingEdit = false
    }
  }

  function requestDeleteCategory(category: Category): void {
    activeActionRowId = null
    if (deletingId) {
      return
    }

    clearMutationFeedback()
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

    clearMutationFeedback()
    deletingId = category.id

    try {
      await deleteCategory(category.id)
      invalidateCategoriesCache()
      if (editingId === category.id) {
        cancelEdit()
      }
      closeDeleteDialog()
      successMessage = 'Category deleted.'
      await fetchCategories(true)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      mutationError = getErrorMessage(error, 'Unable to delete category.')
    } finally {
      deletingId = null
    }
  }

  onMount(function initCategoriesPage(): void {
    void fetchCategories()
  })
</script>

<svelte:window on:click={onMainClick} />

<main>
  <Collapsible.Root bind:open={createOpen}>
    <Collapsible.Trigger class="collapsible-trigger">
      <span>Add category</span>
      <span aria-hidden="true"></span>
    </Collapsible.Trigger>
    <Collapsible.Content class="collapsible-content">
      {#if mutationError}
        <p role="alert">{mutationError}</p>
      {/if}

      {#if successMessage}
        <p role="status">{successMessage}</p>
      {/if}

      <form on:submit={onCreateSubmit} novalidate>
        <div>
          <label for="create-category-name">Category name</label>
          <input id="create-category-name" type="text" bind:value={createName} />
          {#if createNameError}
            <p role="alert">{createNameError}</p>
          {/if}
        </div>

        <div>
          <p id="create-category-type">Type</p>
          <Tabs.Root value={createType} onValueChange={onCreateTypeChange}>
            <Tabs.List class="tabs-list" aria-labelledby="create-category-type">
              <Tabs.Trigger class="tabs-trigger" value="expense">Expense</Tabs.Trigger>
              <Tabs.Trigger class="tabs-trigger" value="income">Income</Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>

        <Button.Root class="btn btn--primary" type="submit" disabled={creating}>
          {creating ? 'Creating...' : 'Create category'}
        </Button.Root>
      </form>
    </Collapsible.Content>
  </Collapsible.Root>

  <section aria-live="polite">
    <div>
      <label for="category-search">Search</label>
      <input
        id="category-search"
        type="search"
        placeholder="Search category names"
        bind:value={search}
      />
      {#if searchValidationError}
        <p role="alert">{searchValidationError}</p>
      {/if}
    </div>

    {#if loading}
      <p>Loading categories...</p>
    {:else if loadError}
      <p role="alert">{loadError}</p>
    {:else if visibleCategories.length === 0}
      <p>No categories found. Create one to start organizing records.</p>
    {:else}
      <div>
        <section aria-labelledby="income-heading">
          <p id="income-heading">Income</p>
          {#if incomeCategories.length === 0}
            <p>No income categories yet.</p>
          {:else}
            <div>
              {#each incomeCategories as category}
                <div
                  data-action-row-shell
                  class="row-action-shell"
                  data-type="income"
                  role="button"
                  tabindex="0"
                  on:click={(event) => onRowShellClick(event, category.id)}
                  on:keydown={(event) => onRowShellKeydown(event, category.id)}
                >
                  <ListRow type="income">
                    <span slot="main">{category.name}</span>
                  </ListRow>
                  {#if activeActionRowId === category.id}
                    <div class="row-action-panel">
                      <Button.Root
                        class="btn btn--compact"
                        type="button"
                        onclick={() => startEdit(category)}
                      >
                        Edit
                      </Button.Root>
                      <Button.Root
                        class="btn btn--compact"
                        type="button"
                        disabled={deletingId === category.id}
                        onclick={() => requestDeleteCategory(category)}
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
                      </Button.Root>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <section aria-labelledby="expense-heading">
          <p id="expense-heading">Expense</p>
          {#if expenseCategories.length === 0}
            <p>No expense categories yet.</p>
          {:else}
            <div>
              {#each expenseCategories as category}
                <div
                  data-action-row-shell
                  class="row-action-shell"
                  data-type="expense"
                  role="button"
                  tabindex="0"
                  on:click={(event) => onRowShellClick(event, category.id)}
                  on:keydown={(event) => onRowShellKeydown(event, category.id)}
                >
                  <ListRow type="expense">
                    <span slot="main">{category.name}</span>
                  </ListRow>
                  {#if activeActionRowId === category.id}
                    <div class="row-action-panel">
                      <Button.Root
                        class="btn btn--compact"
                        type="button"
                        onclick={() => startEdit(category)}
                      >
                        Edit
                      </Button.Root>
                      <Button.Root
                        class="btn btn--compact"
                        type="button"
                        disabled={deletingId === category.id}
                        onclick={() => requestDeleteCategory(category)}
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
                      </Button.Root>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </section>
      </div>

      <Dialog.Root open={editDialogOpen} onOpenChange={onEditDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay class="dialog-overlay" />
          <Dialog.Content class="dialog-content">
            <Dialog.Title>Edit category</Dialog.Title>
            <Dialog.Description>
              {editingCategoryName
                ? `Update "${editingCategoryName}".`
                : 'Update selected category.'}
            </Dialog.Description>

            <div>
              <label for="edit-category-name">Category name</label>
              <input id="edit-category-name" type="text" bind:value={editName} />
              {#if editNameError}
                <p role="alert">{editNameError}</p>
              {/if}
            </div>

            <div class="button-row">
              <Button.Root
                class="btn btn--primary"
                type="button"
                onclick={saveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving...' : 'Save changes'}
              </Button.Root>
              <Button.Root class="btn btn--secondary" type="button" onclick={cancelEdit}>
                Cancel
              </Button.Root>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
  </section>
</main>
