<script lang="ts">
  import { goto } from '$app/navigation'
  import type { DateValue } from '@internationalized/date'
  import { Button, DatePicker, Dialog } from 'bits-ui'
  import { deleteRecord, getRecords, updateRecord } from '$lib/features/records/api'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import ListRow from '$lib/components/ListRow.svelte'
  import PeriodControls from '$lib/components/PeriodControls.svelte'
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte'
  import Block from '$lib/components/Block.svelte'
  import SelectField from '$lib/components/SelectField.svelte'
  import {
    dateValueToIso,
    isoToDateValue,
    periodFromPreset,
    type PeriodPreset,
  } from '$lib/shared/date'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import {
    validateAmount,
    validateDate,
    validateRecordName,
    validateSearchTerm,
  } from '$lib/shared/validation'
  import { onMount } from 'svelte'

  type ApiError = Error & { status?: number }
  type SortMode = 'date_desc' | 'date_asc' | 'category_asc' | 'amount_desc' | 'amount_asc'
  type TypeFilter = 'all' | 'income' | 'expense'
  type SelectOption = {
    value: string
    label: string
  }
  type DateGroup = {
    date: string
    records: RecordItem[]
  }

  const initialRange = periodFromPreset('month')

  let records: RecordItem[] = []
  let categories: Category[] = []
  let loading = true
  let loadError = ''
  let mutationError = ''
  let successMessage = ''

  let periodPreset: PeriodPreset = 'month'
  let startDate = initialRange.start
  let endDate = initialRange.end

  let search = ''
  let categoryFilter = 'all'
  let typeFilter: TypeFilter = 'all'
  let sortMode: SortMode = 'date_desc'

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

  const typeFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
  ]

  const sortOptions: Array<{ value: SortMode; label: string }> = [
    { value: 'date_desc', label: 'Date (newest)' },
    { value: 'date_asc', label: 'Date (oldest)' },
    { value: 'category_asc', label: 'Category' },
    { value: 'amount_desc', label: 'Amount (high to low)' },
    { value: 'amount_asc', label: 'Amount (low to high)' },
  ]

  function isTypeFilter(value: string): value is TypeFilter {
    return value === 'all' || value === 'income' || value === 'expense'
  }

  function isSortMode(value: string): value is SortMode {
    return (
      value === 'date_desc' ||
      value === 'date_asc' ||
      value === 'category_asc' ||
      value === 'amount_desc' ||
      value === 'amount_asc'
    )
  }

  $: normalizedSearchTerm = search.trim()
  $: searchValidationError = validateSearchTerm(normalizedSearchTerm) ?? ''
  $: normalizedSearch = normalizedSearchTerm.toLowerCase()
  $: categoryById = new Map(categories.map((item) => [item.id, item]))
  $: categoryFilterLabel =
    categoryFilter === 'all'
      ? 'All categories'
      : (categories.find((category) => category.id === categoryFilter)?.name ?? 'All categories')
  $: typeFilterLabel =
    typeFilterOptions.find((option) => option.value === typeFilter)?.label ?? 'All'
  $: sortModeLabel =
    sortOptions.find((option) => option.value === sortMode)?.label ?? 'Date (newest)'
  $: editCategoryLabel =
    categories.find((category) => category.id === editCategoryId)?.name ?? 'Choose category'
  $: categoryFilterItems = [
    { value: 'all', label: 'All categories' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]
  $: editCategoryItems = [
    { value: '', label: 'Choose category' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ]
  $: editRecordName = records.find((record) => record.id === editingId)?.name ?? ''
  $: editDateValue = isoToDateValue(editDate)
  $: filteredRecords = records
    .filter((record) => matchesRecordFilters(record, normalizedSearch))
    .sort((left, right) => compareRecords(left, right, sortMode, categoryById))
  $: groupedRecords = groupRecordsByDate(filteredRecords, sortMode)

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

  function matchesRecordFilters(record: RecordItem, normalizedSearchValue: string): boolean {
    if (normalizedSearchValue && !record.name.toLowerCase().includes(normalizedSearchValue)) {
      return false
    }

    if (categoryFilter !== 'all' && record.category_id !== categoryFilter) {
      return false
    }

    if (typeFilter === 'income') {
      return record.amount > 0
    }

    if (typeFilter === 'expense') {
      return record.amount < 0
    }

    return true
  }

  function compareRecords(
    left: RecordItem,
    right: RecordItem,
    mode: SortMode,
    categoriesById: Map<string, Category>,
  ): number {
    switch (mode) {
      case 'date_asc':
        return left.date.localeCompare(right.date)
      case 'date_desc':
        return right.date.localeCompare(left.date)
      case 'amount_asc':
        return left.amount - right.amount
      case 'amount_desc':
        return right.amount - left.amount
      case 'category_asc': {
        const leftName = categoriesById.get(left.category_id)?.name ?? ''
        const rightName = categoriesById.get(right.category_id)?.name ?? ''
        return leftName.localeCompare(rightName)
      }
    }
  }

  function clearMutationFeedback(): void {
    mutationError = ''
    successMessage = ''
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
    clearMutationFeedback()
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
    categoryFilter = nextCategoryId
  }

  function onTypeFilterChange(nextType: string): void {
    if (isTypeFilter(nextType)) {
      typeFilter = nextType
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

    clearMutationFeedback()

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
      cancelEdit()
      successMessage = 'Record updated.'
      await fetchData()
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      mutationError = getErrorMessage(error, 'Unable to update record.')
    } finally {
      savingEdit = false
    }
  }

  function requestDeleteRecord(record: RecordItem): void {
    activeActionRowId = null
    if (deletingId) {
      return
    }

    clearMutationFeedback()
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

    clearMutationFeedback()
    deletingId = id

    try {
      await deleteRecord(id)
      closeDeleteDialog()
      successMessage = 'Record deleted.'
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
      mutationError = getErrorMessage(error, 'Unable to delete record.')
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

  onMount(function initRecordsPage(): void {
    void fetchData()
  })
</script>

<svelte:window on:click={onMainClick} />

<main>
  <Block title="Records">
    <PeriodControls
      bind:preset={periodPreset}
      bind:start={startDate}
      bind:end={endDate}
      disabled={loading}
      on:change={onPeriodChange}
    />

    <div>
      <div>
        <label for="records-search">Search</label>
        <input
          id="records-search"
          type="search"
          placeholder="Search by record name"
          bind:value={search}
        />
        {#if searchValidationError}
          <p role="alert">{searchValidationError}</p>
        {/if}
      </div>

      <div>
        <div>
          <label for="records-category-filter">Category</label>
          <SelectField
            id="records-category-filter"
            value={categoryFilter}
            label={categoryFilterLabel}
            items={categoryFilterItems}
            onValueChange={onCategoryFilterChange}
          />
        </div>

        <div>
          <label for="records-type-filter">Type</label>
          <SelectField
            id="records-type-filter"
            value={typeFilter}
            label={typeFilterLabel}
            items={typeFilterOptions}
            onValueChange={onTypeFilterChange}
          />
        </div>

        <div>
          <label for="records-sort">Sort</label>
          <SelectField
            id="records-sort"
            value={sortMode}
            label={sortModeLabel}
            items={sortOptions}
            onValueChange={onSortModeChange}
          />
        </div>
      </div>
    </div>
  </Block>

  <Block title="Records">
    <div aria-live="polite">
      {#if successMessage}
        <p role="status">{successMessage}</p>
      {/if}

      {#if mutationError}
        <p role="alert">{mutationError}</p>
      {/if}

      {#if loading}
        <p>Loading records...</p>
      {:else if loadError}
        <p role="alert">{loadError}</p>
      {:else if filteredRecords.length === 0}
        <p>
          No matches. Add new records from
          <a href="/home">Home</a>.
        </p>
      {:else}
        <div class="section-list">
          {#each groupedRecords as group (group.date)}
            <section class="section-compact" aria-labelledby={`records-date-${group.date}`}>
              <p id={`records-date-${group.date}`}>{group.date}</p>
              {#each group.records as record (record.id)}
                <div
                  data-action-row-shell
                  class="row-action-shell"
                  data-type={record.amount > 0 ? 'income' : 'expense'}
                  role="button"
                  tabindex="0"
                  on:click={(event) => onRowShellClick(event, record.id)}
                  on:keydown={(event) => onRowShellKeydown(event, record.id)}
                >
                  <ListRow type={record.amount > 0 ? 'income' : 'expense'}>
                    <div slot="main">{record.name}</div>
                    <div slot="end">
                      <div
                        class="amount"
                        class:amount--income={record.amount > 0}
                        class:amount--expense={record.amount < 0}
                      >
                        {record.amount.toFixed(2)}
                      </div>
                    </div>
                    <svelte:fragment slot="sub">
                      <span>{categoryById.get(record.category_id)?.name ?? 'Unknown category'}</span
                      >
                    </svelte:fragment>
                  </ListRow>
                  {#if activeActionRowId === record.id}
                    <div class="row-action-panel">
                      <Button.Root
                        class="btn btn--compact"
                        type="button"
                        onclick={() => startEdit(record)}
                      >
                        Edit
                      </Button.Root>
                      <Button.Root
                        class="btn btn--compact"
                        type="button"
                        disabled={deletingId === record.id}
                        onclick={() => requestDeleteRecord(record)}
                      >
                        {deletingId === record.id ? 'Deleting...' : 'Delete'}
                      </Button.Root>
                    </div>
                  {/if}
                </div>
              {/each}
            </section>
          {/each}
        </div>

        <Dialog.Root open={editDialogOpen} onOpenChange={onEditDialogOpenChange}>
          <Dialog.Portal>
            <Dialog.Overlay class="dialog-overlay" />
            <Dialog.Content class="dialog-content">
              <Dialog.Title>Edit record</Dialog.Title>
              <Dialog.Description>
                {editRecordName ? `Update "${editRecordName}".` : 'Update selected record.'}
              </Dialog.Description>

              <div>
                <label for="edit-record-name">Name</label>
                <input id="edit-record-name" type="text" bind:value={editName} />
                {#if editNameError}
                  <p role="alert">{editNameError}</p>
                {/if}
              </div>

              <div>
                <label for="edit-record-amount">Amount</label>
                <input
                  id="edit-record-amount"
                  type="number"
                  step="0.01"
                  bind:value={editAmountInput}
                />
                {#if editAmountError}
                  <p role="alert">{editAmountError}</p>
                {/if}
              </div>

              <div>
                <label for="edit-record-category">Category</label>
                <SelectField
                  id="edit-record-category"
                  value={editCategoryId}
                  label={editCategoryLabel}
                  items={editCategoryItems}
                  onValueChange={onEditCategoryChange}
                />
                {#if editCategoryError}
                  <p role="alert">{editCategoryError}</p>
                {/if}
              </div>

              <div>
                <label for="edit-record-date">Date</label>
                <DatePicker.Root value={editDateValue} onValueChange={onEditDateChange}>
                  <DatePicker.Trigger class="control" id="edit-record-date" type="button">
                    {editDate || 'Pick a date'}
                  </DatePicker.Trigger>
                  <DatePicker.Portal>
                    <DatePicker.Content class="popover" sideOffset={6} align="start">
                      <DatePicker.Calendar class="calendar">
                        {#snippet children({ months, weekdays })}
                          <DatePicker.Header>
                            <DatePicker.PrevButton aria-label="Previous month"
                              >Prev</DatePicker.PrevButton
                            >
                            <DatePicker.Heading />
                            <DatePicker.NextButton aria-label="Next month"
                              >Next</DatePicker.NextButton
                            >
                          </DatePicker.Header>
                          <div>
                            {#each months as month (month.value.toString())}
                              <DatePicker.Grid>
                                <DatePicker.GridHead>
                                  <DatePicker.GridRow>
                                    {#each weekdays as day}
                                      <DatePicker.HeadCell>{day}</DatePicker.HeadCell>
                                    {/each}
                                  </DatePicker.GridRow>
                                </DatePicker.GridHead>
                                <DatePicker.GridBody>
                                  {#each month.weeks as weekDates}
                                    <DatePicker.GridRow>
                                      {#each weekDates as calendarDate}
                                        <DatePicker.Cell date={calendarDate} month={month.value}>
                                          <DatePicker.Day>{calendarDate.day}</DatePicker.Day>
                                        </DatePicker.Cell>
                                      {/each}
                                    </DatePicker.GridRow>
                                  {/each}
                                </DatePicker.GridBody>
                              </DatePicker.Grid>
                            {/each}
                          </div>
                        {/snippet}
                      </DatePicker.Calendar>
                    </DatePicker.Content>
                  </DatePicker.Portal>
                </DatePicker.Root>
                {#if editDateError}
                  <p role="alert">{editDateError}</p>
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
          title="Delete record"
          description={pendingDeleteRecord
            ? `Delete record "${pendingDeleteRecord.name}"? This cannot be undone.`
            : 'Delete selected record? This cannot be undone.'}
          confirmLabel="Delete"
          confirmBusyLabel="Deleting..."
          busy={deletingId === pendingDeleteRecord?.id}
          onConfirm={confirmDeleteRecord}
        />
      {/if}
    </div>
  </Block>
</main>
