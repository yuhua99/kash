<script lang="ts">
  import { goto } from '$app/navigation'
  import type { DateValue } from '@internationalized/date'
  import { Button, DatePicker, Tabs } from 'bits-ui'
  import { createRecord } from '$lib/features/records/api'
  import { getCategoriesCached } from '$lib/features/categories/cache'
  import { dateValueToIso, isoToDateValue, todayIso } from '$lib/shared/date'
  import type { Category } from '$lib/core/domain/models'
  import { validateAmount, validateDate, validateRecordName } from '$lib/shared/validation'
  import Block from '$lib/components/Block.svelte'
  import SelectField from '$lib/components/SelectField.svelte'
  import { onMount } from 'svelte'

  type ApiError = Error & { status?: number }
  let categories: Category[] = []
  let loading = true
  let loadError = ''

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
  let formError = ''
  let successMessage = ''
  let submitting = false

  $: parsedAmount = Number(amountInput)
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

  async function loadCategories(): Promise<void> {
    loading = true
    loadError = ''

    try {
      categories = await getCategoriesCached()
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

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    successMessage = ''
    formError = ''
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

      name = ''
      amountInput = ''
      categoryId = ''
      date = todayIso()
      successMessage = 'Record added successfully.'
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      formError = getErrorMessage(error, 'Unable to create record.')
    } finally {
      submitting = false
    }
  }

  onMount(function initHomePage(): void {
    void loadCategories()
  })
</script>

<main>
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
      {#if successMessage}
        <p role="status">{successMessage}</p>
      {/if}

      {#if formError}
        <p role="alert">{formError}</p>
      {/if}

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
              <DatePicker.Content class="popover" sideOffset={6} align="start">
                <DatePicker.Calendar class="calendar">
                  {#snippet children({ months, weekdays })}
                    <DatePicker.Header>
                      <DatePicker.PrevButton aria-label="Previous month">Prev</DatePicker.PrevButton
                      >
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
          {#if nameError}
            <p role="alert">{nameError}</p>
          {/if}
        </div>

        <Button.Root class="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save record'}
        </Button.Root>
      </form>
    {/if}
  </Block>
</main>
