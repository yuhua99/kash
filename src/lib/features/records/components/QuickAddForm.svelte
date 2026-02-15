<script lang="ts">
  import { goto } from '$app/navigation'
  import type { DateValue } from '@internationalized/date'
  import { DatePicker, Tabs } from 'bits-ui'
  import { createRecord } from '$lib/features/records/api'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { dateValueToIso, isoToDateValue, todayIso } from '$lib/shared/date'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import { validateAmount, validateDate, validateRecordName } from '$lib/shared/validation'
  import { toast } from '$lib/ui/toast'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import SelectField from '$lib/ui/SelectField.svelte'
  import '$lib/ui/Control.css'
  import '$lib/ui/DatePicker.css'
  import '$lib/ui/Tabs.css'

  type ApiError = Error & { status?: number }

  export let categories: Category[] = []
  export let recentRecords: RecordItem[] = []
  export let loading = false
  export let loadError = ''

  let name = ''
  let amountInput = ''
  let categoryId = ''
  let date = todayIso()
  let recordType: 'expense' | 'income' = 'expense'
  let isIncome = false

  let nameError = ''
  let amountError = ''
  let categoryError = ''
  let dateError = ''
  let submitting = false

  const MAX_NAME_SUGGESTIONS = 5

  $: parsedAmount = Number(amountInput)
  $: absoluteAmount = Math.abs(parsedAmount)
  $: isIncome = recordType === 'income'
  $: filteredCategories = categories.filter((category) => category.is_income === isIncome)
  $: categorySelectItems = filteredCategories.map((category) => ({
    value: category.id,
    label: category.name,
  }))
  $: selectedCategoryLabel =
    filteredCategories.find((category) => category.id === categoryId)?.name ?? 'Choose category'
  $: dateValue = isoToDateValue(date)
  $: if (categoryId && !filteredCategories.some((category) => category.id === categoryId)) {
    categoryId = ''
  }
  $: canSuggestNames =
    Boolean(categoryId) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    recentRecords.length > 0
  $: suggestedNames = canSuggestNames
    ? getSuggestedRecordNames(recentRecords, categoryId, absoluteAmount, MAX_NAME_SUGGESTIONS)
    : []

  function clearValidationErrors(): void {
    nameError = ''
    amountError = ''
    categoryError = ''
    dateError = ''
  }

  function getErrorMessage(error: unknown, fallbackMessage: string): string {
    return error instanceof Error ? error.message : fallbackMessage
  }

  function onCategoryChange(nextCategoryId: string): void {
    categoryId = nextCategoryId
    categoryError = ''
  }

  function onRecordTypeChange(nextValue: string): void {
    if (nextValue === 'income' || nextValue === 'expense') {
      recordType = nextValue
    }
    categoryError = ''
  }

  function onDateChange(nextDate: DateValue | undefined): void {
    date = dateValueToIso(nextDate)
    dateError = ''
  }

  function getSuggestedRecordNames(
    records: RecordItem[],
    targetCategoryId: string,
    targetAbsoluteAmount: number,
    limit: number,
  ): string[] {
    const ranked = records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => record.category_id === targetCategoryId)
      .map(({ record, index }) => ({
        name: record.name.trim(),
        diff: Math.abs(Math.abs(record.amount) - targetAbsoluteAmount),
        index,
      }))
      .filter((item) => item.name.length > 0)
      .sort((left, right) => left.diff - right.diff || left.index - right.index)

    const seen = new Set<string>()
    const names: string[] = []

    for (const item of ranked) {
      const normalized = item.name.toLowerCase()
      if (seen.has(normalized)) {
        continue
      }

      seen.add(normalized)
      names.push(item.name)

      if (names.length >= limit) {
        break
      }
    }

    return names
  }

  function onSuggestionClick(suggestedName: string): void {
    name = suggestedName
    nameError = ''
  }

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    clearValidationErrors()

    const normalizedName = name.trim()
    const normalizedDate = date.trim()
    const selectedCategory = categories.find((item) => item.id === categoryId)

    const nameValidation = validateRecordName(normalizedName)
    const amountValidation = validateAmount(parsedAmount)
    const dateValidation = validateDate(normalizedDate)

    if (nameValidation) nameError = nameValidation
    if (parsedAmount < 0) {
      amountError = 'Amount cannot be negative.'
    } else if (amountValidation) {
      amountError = amountValidation
    }
    if (dateValidation) dateError = dateValidation
    if (!selectedCategory) categoryError = 'Choose a category.'

    if (selectedCategory && selectedCategory.is_income !== isIncome) {
      categoryError = 'Selected category does not match amount type.'
    }

    if (nameError || amountError || categoryError || dateError) {
      return
    }

    submitting = true
    try {
      const normalizedAmount = isIncome ? parsedAmount : -parsedAmount
      await createRecord({
        name: normalizedName,
        amount: normalizedAmount,
        category_id: categoryId,
        date: normalizedDate,
      })
      invalidateRecordsCache()

      name = ''
      amountInput = ''
      categoryId = ''
      date = todayIso()
      toast.success('Record added successfully.')
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to create record.'))
    } finally {
      submitting = false
    }
  }
</script>

<Block title="Quick add">
  {#if loading}
    <p>Loading categories...</p>
  {:else if loadError}
    <p role="alert">{loadError}</p>
  {:else if categories.length === 0}
    <p>
      You do not have categories yet. Create one in
      <a href="/categories">Categories</a>
      first.
    </p>
  {:else}
    <form on:submit={onSubmit} novalidate>
      <div>
        <label for="record-amount">Amount</label>
        <input
          id="record-amount"
          type="number"
          step="0.01"
          min="0"
          bind:value={amountInput}
          required
        />
        {#if amountError}
          <p role="alert">{amountError}</p>
        {/if}
      </div>

      <div>
        <p id="record-type">Type</p>
        <Tabs.Root value={recordType} onValueChange={onRecordTypeChange}>
          <Tabs.List class="tabs-list" aria-labelledby="record-type">
            <Tabs.Trigger class="tabs-trigger" value="expense">Expense</Tabs.Trigger>
            <Tabs.Trigger class="tabs-trigger" value="income">Income</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>

      <div>
        <label for="record-category">Category</label>
        <SelectField
          id="record-category"
          value={categoryId}
          label={selectedCategoryLabel}
          items={categorySelectItems}
          onValueChange={onCategoryChange}
        />
        {#if categoryError}
          <p role="alert">{categoryError}</p>
        {/if}
      </div>

      <div>
        <label for="record-date">Date</label>
        <DatePicker.Root value={dateValue} onValueChange={onDateChange}>
          <DatePicker.Trigger class="control" id="record-date" type="button">
            {date || 'Pick a date'}
          </DatePicker.Trigger>
          <DatePicker.Portal>
            <DatePicker.Content class="date-popover" sideOffset={6} align="start">
              <DatePicker.Calendar class="date-calendar">
                {#snippet children({ months, weekdays })}
                  <DatePicker.Header>
                    <DatePicker.PrevButton aria-label="Previous month">Prev</DatePicker.PrevButton>
                    <DatePicker.Heading />
                    <DatePicker.NextButton aria-label="Next month">Next</DatePicker.NextButton>
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
        {#if dateError}
          <p role="alert">{dateError}</p>
        {/if}
      </div>

      <div>
        <label for="record-name">Record name</label>
        <input id="record-name" type="text" bind:value={name} required />
        {#if suggestedNames.length > 0}
          <div class="quick-add-suggestions" aria-label="Record name suggestions">
            {#each suggestedNames as suggestedName (suggestedName)}
              <button
                type="button"
                class="quick-add-suggestions__capsule"
                on:click={() => onSuggestionClick(suggestedName)}
              >
                {suggestedName}
              </button>
            {/each}
          </div>
        {/if}
        {#if nameError}
          <p role="alert">{nameError}</p>
        {/if}
      </div>

      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save record'}
      </Button>
    </form>
  {/if}
</Block>

<style>
  .quick-add-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .quick-add-suggestions__capsule {
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
  }

  .quick-add-suggestions__capsule:hover {
    border-color: var(--accent);
    color: var(--text);
  }

  .quick-add-suggestions__capsule:focus-visible {
    border-color: var(--accent-strong);
    color: var(--text);
  }
</style>
