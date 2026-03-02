<script lang="ts">
  import { goto } from '$app/navigation'
  import type { DateValue } from '@internationalized/date'
  import { deleteRecord, getRecords, updateRecord } from '$lib/features/records/api'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import { toast } from '$lib/ui/toast'
  import Block from '$lib/ui/Block.svelte'
  import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
  import RecordEditDialog from '$lib/features/records/components/RecordEditDialog.svelte'
  import RecordFilters from '$lib/features/records/components/RecordFilters.svelte'
  import RecordList from '$lib/features/records/components/RecordList.svelte'
  import PendingRecordSection from '$lib/features/records/components/PendingRecordSection.svelte'
  import { dateValueToIso, isoToDateValue, type PeriodPreset } from '$lib/shared/date'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import {
    validateAmount,
    validateDate,
    validateRecordName,
    validateSearchTerm,
  } from '$lib/shared/validation'
  import type { PageData } from './$types'

  type ApiError = Error & { status?: number }
  type SortMode = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  type CategoryFilterMode = 'all_expenses' | 'all_incomes' | 'pending' | `category:${string}`
  type SelectOption =
    | {
        kind?: 'item'
        value: string
        label: string
      }
    | {
        kind: 'separator'
      }
  type DateGroup = {
    date: string
    records: RecordItem[]
  }

  type RecordsPageData = PageData & {
    records: RecordItem[]
    categories: Category[]
    periodPreset: PeriodPreset
    startDate: string
    endDate: string
    categoryFilter: CategoryFilterMode
    sortMode: SortMode
    loadError?: string
  }

  export let data: RecordsPageData

  let records: RecordItem[] = data.records
  let categories: Category[] = data.categories
  let loading = false
  let loadError = data.loadError ?? ''

  let periodPreset: PeriodPreset = data.periodPreset
  let startDate = data.startDate
  let endDate = data.endDate

  let search = ''
  let categoryFilter: CategoryFilterMode = data.categoryFilter
  let sortMode: SortMode = data.sortMode

  let editingId: string | null = null
  let editName = ''
  let editAmountInput = ''
  let editCategoryId = ''
  let editDate = ''

  let editNameError = ''
  let editAmountError = ''
  let editCategoryError = ''
  let editDateError = ''
  let editDialogOpen = false
  let deleteDialogOpen = false
  let pendingDeleteRecord: RecordItem | null = null

  let savingEdit = false
  let deletingId: string | null = null
  let activeActionRowId: string | null = null

  const CATEGORY_FILTER_ALL_EXPENSES: CategoryFilterMode = 'all_expenses'
  const CATEGORY_FILTER_ALL_INCOMES: CategoryFilterMode = 'all_incomes'
  const CATEGORY_FILTER_PENDING: CategoryFilterMode = 'pending'

  function toCategoryFilterValue(categoryId: string): CategoryFilterMode {
    return `category:${categoryId}`
  }

  function isCategoryFilterMode(value: string): value is CategoryFilterMode {
    return (
      value === CATEGORY_FILTER_ALL_EXPENSES ||
      value === CATEGORY_FILTER_ALL_INCOMES ||
      value === CATEGORY_FILTER_PENDING ||
      value.startsWith('category:')
    )
  }

  function categoryIdFromFilterValue(filterValue: CategoryFilterMode): string | null {
    if (!filterValue.startsWith('category:')) {
      return null
    }

    return filterValue.slice('category:'.length)
  }

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'date_desc', label: 'Date (newest)' },
    { value: 'date_asc', label: 'Date (oldest)' },
    { value: 'amount_desc', label: 'Amount (high to low)' },
    { value: 'amount_asc', label: 'Amount (low to high)' },
  ]

  function isSortMode(value: string): value is SortMode {
    return (
      value === 'date_desc' ||
      value === 'date_asc' ||
      value === 'amount_desc' ||
      value === 'amount_asc'
    )
  }

  $: normalizedSearchTerm = search.trim()
  $: searchValidationError = validateSearchTerm(normalizedSearchTerm) ?? ''
  $: normalizedSearch = normalizedSearchTerm.toLowerCase()
  $: categoryById = new Map(categories.map((item) => [item.id, item]))
  $: expenseCategories = categories.filter((category) => !category.is_income)
  $: incomeCategories = categories.filter((category) => category.is_income)
  $: selectedCategoryId = categoryIdFromFilterValue(categoryFilter)
  $: categoryFilterLabel =
    categoryFilter === CATEGORY_FILTER_PENDING
      ? 'You owe'
      : categoryFilter === CATEGORY_FILTER_ALL_EXPENSES
        ? 'All expenses'
        : categoryFilter === CATEGORY_FILTER_ALL_INCOMES
          ? 'All incomes'
          : (categories.find((category) => category.id === selectedCategoryId)?.name ??
            'All expenses')
  $: sortModeLabel =
    sortOptions.find((option) => option.value === sortMode)?.label ?? 'Date (newest)'
  $: editCategoryLabel =
    categories.find((category) => category.id === editCategoryId)?.name ?? 'Choose category'
  $: categoryFilterItems = [
    { value: CATEGORY_FILTER_PENDING, label: 'You owe' },
    { value: CATEGORY_FILTER_ALL_EXPENSES, label: 'All expenses' },
    ...expenseCategories.map((category) => ({
      value: toCategoryFilterValue(category.id),
      label: category.name,
    })),
    { kind: 'separator' as const },
    { value: CATEGORY_FILTER_ALL_INCOMES, label: 'All incomes' },
    ...incomeCategories.map((category) => ({
      value: toCategoryFilterValue(category.id),
      label: category.name,
    })),
  ] satisfies SelectOption[]
  $: editCategoryItems = [
    { value: '', label: 'Choose category' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]
  $: editRecordName = records.find((record) => record.id === editingId)?.name ?? ''
  $: editDateValue = isoToDateValue(editDate)
  $: pendingRecords = records.filter((record) => record.pending)
  $: filteredRecords = records
    .filter((record) =>
      matchesRecordFilters(record, {
        normalizedSearchValue: normalizedSearch,
        categoryFilterValue: categoryFilter,
      }),
    )
    .sort((left, right) => compareRecords(left, right, sortMode))
  $: shouldGroupByDate = sortMode === 'date_desc' || sortMode === 'date_asc'
  $: groupedRecords = shouldGroupByDate ? groupRecordsByDate(filteredRecords, sortMode) : []

  $: if (data) {
    records = data.records
    categories = data.categories
    periodPreset = data.periodPreset
    startDate = data.startDate
    endDate = data.endDate
    categoryFilter = data.categoryFilter
    sortMode = data.sortMode
    loadError = data.loadError ?? ''
    loading = false
  }

  function groupRecordsByDate(items: RecordItem[], mode: SortMode): DateGroup[] {
    const grouped = new Map<string, RecordItem[]>()

    for (const item of items) {
      const bucket = grouped.get(item.date)
      if (bucket) {
        bucket.push(item)
        continue
      }

      grouped.set(item.date, [item])
    }

    const dates = [...grouped.keys()].sort((left, right) => {
      if (mode === 'date_asc') {
        return left.localeCompare(right)
      }

      return right.localeCompare(left)
    })

    return dates.map((date) => ({
      date,
      records: grouped.get(date) ?? [],
    }))
  }

  function matchesRecordFilters(
    record: RecordItem,
    {
      normalizedSearchValue,
      categoryFilterValue,
    }: { normalizedSearchValue: string; categoryFilterValue: CategoryFilterMode },
  ): boolean {
    if (normalizedSearchValue && !record.name.toLowerCase().includes(normalizedSearchValue)) {
      return false
    }

    if (categoryFilterValue === CATEGORY_FILTER_ALL_EXPENSES) {
      return record.amount < 0
    }

    if (categoryFilterValue === CATEGORY_FILTER_PENDING) {
      return record.pending === true
    }

    if (categoryFilterValue === CATEGORY_FILTER_ALL_INCOMES) {
      return record.amount > 0
    }

    const selectedCategoryId = categoryIdFromFilterValue(categoryFilterValue)
    if (!selectedCategoryId || record.category_id !== selectedCategoryId) {
      return false
    }

    return true
  }

  function compareRecords(left: RecordItem, right: RecordItem, mode: SortMode): number {
    switch (mode) {
      case 'date_asc':
        return left.date.localeCompare(right.date)
      case 'date_desc':
        return right.date.localeCompare(left.date)
      case 'amount_asc': {
        const leftAbs = Math.abs(left.amount)
        const rightAbs = Math.abs(right.amount)
        return leftAbs - rightAbs || left.amount - right.amount
      }
      case 'amount_desc': {
        const leftAbs = Math.abs(left.amount)
        const rightAbs = Math.abs(right.amount)
        return rightAbs - leftAbs || right.amount - left.amount
      }
    }
  }

  function toggleRowActions(recordId: string): void {
    activeActionRowId = activeActionRowId === recordId ? null : recordId
  }

  function onRowShellClick(event: MouseEvent, recordId: string): void {
    const target = event.target
    if (target instanceof HTMLElement && target.closest('.row-action-panel')) {
      return
    }

    toggleRowActions(recordId)
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

  function onRowShellKeydown(event: KeyboardEvent, recordId: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    toggleRowActions(recordId)
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage
  }

  function clearEditErrors(): void {
    editNameError = ''
    editAmountError = ''
    editCategoryError = ''
    editDateError = ''
  }

  function validateEditForm(): boolean {
    clearEditErrors()
    const parsedAmount = Number(editAmountInput)
    const selectedCategory = categories.find((item) => item.id === editCategoryId)

    const nameValidation = validateRecordName(editName.trim())
    const amountValidation = validateAmount(parsedAmount)
    const dateValidation = validateDate(editDate.trim())

    if (nameValidation) editNameError = nameValidation
    if (amountValidation) editAmountError = amountValidation
    if (dateValidation) editDateError = dateValidation
    if (!selectedCategory) editCategoryError = 'Choose a category.'

    if (
      selectedCategory &&
      parsedAmount !== 0 &&
      ((parsedAmount > 0 && !selectedCategory.is_income) ||
        (parsedAmount < 0 && selectedCategory.is_income))
    ) {
      editCategoryError = 'Selected category does not match amount type.'
    }

    return !(editNameError || editAmountError || editCategoryError || editDateError)
  }

  async function fetchData(): Promise<void> {
    loading = true
    loadError = ''

    try {
      const [recordsResponse, cachedCategories] = await Promise.all([
        getRecords({
          start_date: startDate,
          end_date: endDate,
          limit: 1000,
          offset: 0,
        }),
        getCategoriesCached(),
      ])

      records = recordsResponse.records
      categories = cachedCategories
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      loadError = getErrorMessage(error, 'Unable to load records.')
    } finally {
      loading = false
    }
  }

  function startEdit(record: RecordItem): void {
    activeActionRowId = null
    editingId = record.id
    editName = record.name
    editAmountInput = String(record.amount)
    editCategoryId = record.category_id
    editDate = record.date
    editDialogOpen = true
    clearEditErrors()
  }

  function cancelEdit(): void {
    editDialogOpen = false
    editingId = null
    editName = ''
    editAmountInput = ''
    editCategoryId = ''
    editDate = ''
    clearEditErrors()
  }

  function onEditDialogOpenChange(nextOpen: boolean): void {
    if (nextOpen) {
      editDialogOpen = true
      return
    }

    cancelEdit()
  }

  function onCategoryFilterChange(nextCategoryId: string): void {
    if (isCategoryFilterMode(nextCategoryId)) {
      categoryFilter = nextCategoryId
    }
  }

  function onSortModeChange(nextSortMode: string): void {
    if (isSortMode(nextSortMode)) {
      sortMode = nextSortMode
    }
  }

  function onEditCategoryChange(nextCategoryId: string): void {
    editCategoryId = nextCategoryId
    editCategoryError = ''
  }

  function onEditDateChange(nextDate: DateValue | undefined): void {
    editDate = dateValueToIso(nextDate)
    editDateError = ''
  }

  async function saveEdit(): Promise<void> {
    if (!editingId) {
      return
    }

    if (!validateEditForm()) {
      return
    }

    savingEdit = true
    try {
      await updateRecord(editingId, {
        name: editName.trim(),
        amount: Number(editAmountInput),
        category_id: editCategoryId,
        date: editDate.trim(),
      })
      invalidateRecordsCache()
      cancelEdit()
      toast.success('Record updated.')
      await fetchData()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to update record.'))
    } finally {
      savingEdit = false
    }
  }

  function requestDeleteRecord(record: RecordItem): void {
    activeActionRowId = null
    if (deletingId) {
      return
    }
    pendingDeleteRecord = record
    deleteDialogOpen = true
  }

  function closeDeleteDialog(): void {
    deleteDialogOpen = false
    pendingDeleteRecord = null
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

  async function confirmDeleteRecord(): Promise<void> {
    if (!pendingDeleteRecord) {
      return
    }

    const id = pendingDeleteRecord.id

    deletingId = id

    try {
      await deleteRecord(id)
      invalidateRecordsCache()
      closeDeleteDialog()
      toast.success('Record deleted.')
      if (editingId === id) {
        cancelEdit()
      }
      await fetchData()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to delete record.'))
    } finally {
      deletingId = null
    }
  }

  async function onPeriodChange(
    event: CustomEvent<{ preset: PeriodPreset; start: string; end: string }>,
  ): Promise<void> {
    periodPreset = event.detail.preset
    startDate = event.detail.start
    endDate = event.detail.end
    await fetchData()
  }
</script>

<svelte:window on:click={onMainClick} />

<main>
  {#if pendingRecords.length > 0}
    <Block title="You owe">
      <PendingRecordSection {pendingRecords} {categoryById} />
    </Block>
  {/if}

  <Block title="Records">
    <RecordFilters
      bind:periodPreset
      bind:startDate
      bind:endDate
      bind:search
      {loading}
      {searchValidationError}
      {categoryFilter}
      {categoryFilterLabel}
      {categoryFilterItems}
      {sortMode}
      {sortModeLabel}
      {sortOptions}
      {onPeriodChange}
      {onCategoryFilterChange}
      {onSortModeChange}
    />
  </Block>

  <Block title="Records">
    <RecordList
      {loading}
      {loadError}
      {filteredRecords}
      {groupedRecords}
      {shouldGroupByDate}
      {categoryById}
      {activeActionRowId}
      {deletingId}
      {onRowShellClick}
      {onRowShellKeydown}
      {startEdit}
      {requestDeleteRecord}
    />

    <RecordEditDialog
      {editDialogOpen}
      {onEditDialogOpenChange}
      {editRecordName}
      bind:editName
      {editNameError}
      bind:editAmountInput
      {editAmountError}
      {editCategoryId}
      {editCategoryLabel}
      {editCategoryItems}
      {editCategoryError}
      {editDateValue}
      {editDate}
      {editDateError}
      {onEditCategoryChange}
      {onEditDateChange}
      {saveEdit}
      {cancelEdit}
      {savingEdit}
    />

    <ConfirmDialog
      open={deleteDialogOpen}
      onOpenChange={onDeleteDialogOpenChange}
      title="Delete record"
      description={pendingDeleteRecord
        ? `Delete record "${pendingDeleteRecord.name}"? This cannot be undone.`
        : 'Delete selected record? This cannot be undone.'}
      confirmLabel="Delete"
      confirmBusyLabel="Deleting..."
      busy={deletingId === pendingDeleteRecord?.id}
      onConfirm={confirmDeleteRecord}
    />
  </Block>
</main>
