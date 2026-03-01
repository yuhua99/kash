<script lang="ts">
  import { goto } from '$app/navigation'
  import type { DateValue } from '@internationalized/date'
  import { Collapsible, DatePicker, Tabs } from 'bits-ui'
  import { createRecord } from '$lib/features/records/api'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { getAcceptedFriendsCached } from '$lib/features/friends/cache'
  import { createSplit, generateIdempotencyKey } from '$lib/features/splits/api'
  import { dateValueToIso, isoToDateValue, todayIso } from '$lib/shared/date'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import { validateAmount, validateDate, validateRecordName } from '$lib/shared/validation'
  import { toast } from '$lib/ui/toast'
  import Block from '$lib/ui/Block.svelte'
  import Button from '$lib/ui/Button.svelte'
  import SelectField from '$lib/ui/SelectField.svelte'
  import { onMount } from 'svelte'
  import '$lib/ui/Control.css'
  import '$lib/ui/DatePicker.css'
  import '$lib/ui/Tabs.css'

  type ApiError = Error & { status?: number }
  type FriendRelation = { id: string; user_id: string; pending: boolean; nickname: string | null }
  type SplitParticipant = { user_id: string; amount: number }
  type CreateSplitPayload = {
    idempotency_key: string
    total_amount: number
    description: string
    date: string
    category_id: string
    splits: SplitParticipant[]
  }

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
  let participantsError = ''
  let submitting = false
  let splitEnabled = false
  let splitIdempotencyKey = generateIdempotencyKey()
  let friends: FriendRelation[] = []
  let friendsLoading = false

  // amount each selected friend owes (keyed by user_id)
  let participantAmountInputs: Record<string, string> = {}
  // which friends are selected for the split
  let participantIncluded: Record<string, boolean> = {}
  // whether user has manually edited that friend's amount
  let participantTouched: Record<string, boolean> = {}

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

  $: selectedParticipantIds = friends
    .filter((friend) => participantIncluded[friend.user_id])
    .map((friend) => friend.user_id)

  // Auto-compute equal shares whenever selection or total changes.
  // Manual-touched friends keep their locked amount; untouched friends
  // share the remainder equally. Rounding residual goes to the payer (user).
  $: {
    if (splitEnabled && Number.isFinite(parsedAmount) && parsedAmount > 0) {
      applyAutoShares(selectedParticipantIds, parsedAmount)
    }
  }

  $: participantSplits = buildParticipantSplits(selectedParticipantIds, participantAmountInputs)
  $: participantSum = roundToCents(participantSplits.reduce((sum, p) => sum + p.amount, 0))
  $: yourShare = roundToCents((Number.isFinite(parsedAmount) ? parsedAmount : 0) - participantSum)

  onMount(async () => {
    friendsLoading = true
    try {
      const loadedFriends = await getAcceptedFriendsCached()
      friends = loadedFriends
      resetParticipantState(loadedFriends)
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      toast.error(getErrorMessage(error, 'Unable to load friends.'))
    } finally {
      friendsLoading = false
    }
  })

  function roundToCents(value: number): number {
    return Math.round(value * 100) / 100
  }

  function formatAmount(value: number): string {
    return value.toFixed(2)
  }

  function getFriendLabel(friend: FriendRelation): string {
    return friend.nickname && friend.nickname.trim().length > 0 ? friend.nickname : friend.user_id
  }

  function clearValidationErrors(): void {
    nameError = ''
    amountError = ''
    categoryError = ''
    dateError = ''
    participantsError = ''
  }

  function resetParticipantState(nextFriends: FriendRelation[]): void {
    const nextAmountInputs: Record<string, string> = {}
    const nextIncluded: Record<string, boolean> = {}
    const nextTouched: Record<string, boolean> = {}

    for (const friend of nextFriends) {
      nextAmountInputs[friend.user_id] = ''
      nextIncluded[friend.user_id] = false
      nextTouched[friend.user_id] = false
    }

    participantAmountInputs = nextAmountInputs
    participantIncluded = nextIncluded
    participantTouched = nextTouched
  }

  /**
   * Recompute auto shares.
   * - locked friends (participantTouched) keep their amount
   * - remaining total is split equally among unlocked friends
   * - rounding cents go to the payer (not distributed to friends)
   */
  function applyAutoShares(selectedIds: string[], total: number): void {
    if (selectedIds.length === 0) return

    const lockedTotal = selectedIds
      .filter((id) => participantTouched[id])
      .reduce((sum, id) => sum + (Number(participantAmountInputs[id]) || 0), 0)

    const unlockedIds = selectedIds.filter((id) => !participantTouched[id])
    if (unlockedIds.length === 0) return

    const remaining = total - lockedTotal
    // +1 accounts for the payer (user) as one of the equal-share participants
    const poolCount = unlockedIds.length + 1
    const sharePerPerson = Math.floor((remaining / poolCount) * 100) / 100

    let changed = false
    const nextInputs = { ...participantAmountInputs }

    for (const id of unlockedIds) {
      const suggested = formatAmount(sharePerPerson)
      if (nextInputs[id] !== suggested) {
        nextInputs[id] = suggested
        changed = true
      }
    }

    if (changed) {
      participantAmountInputs = nextInputs
    }
  }

  function toggleParticipant(userId: string): void {
    const isIncluded = Boolean(participantIncluded[userId])
    participantIncluded = { ...participantIncluded, [userId]: !isIncluded }
    participantsError = ''

    if (!isIncluded) {
      // Selecting: if untouched, amount will be set by applyAutoShares reactively
      participantTouched = { ...participantTouched, [userId]: false }
    }
    // Deselecting: keep amount in state (restored on re-select), clear touch lock
    // so it gets recomputed automatically on re-select
    if (isIncluded) {
      participantTouched = { ...participantTouched, [userId]: false }
    }
  }

  function onParticipantRowKeydown(event: KeyboardEvent, userId: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleParticipant(userId)
    }
  }

  function onParticipantAmountInput(event: Event, userId: string): void {
    const value = (event.currentTarget as HTMLInputElement).value
    participantAmountInputs = { ...participantAmountInputs, [userId]: value }
    participantTouched = { ...participantTouched, [userId]: true }
    participantsError = ''
  }

  function onAmountInputClick(event: MouseEvent): void {
    // Prevent row click from toggling selection when clicking inside input
    event.stopPropagation()
  }

  function onSplitOpenChange(open: boolean): void {
    splitEnabled = open
    if (open) {
      resetParticipantState(friends)
      splitIdempotencyKey = generateIdempotencyKey()
    } else {
      participantsError = ''
    }
  }

  function buildParticipantSplits(
    userIds: string[],
    amountInputs: Record<string, string>,
  ): SplitParticipant[] {
    return userIds.map((userId) => ({
      user_id: userId,
      amount: Number(amountInputs[userId] ?? ''),
    }))
  }

  function validateParticipantAmount(value: number): string | null {
    if (!Number.isFinite(value) || value <= 0) {
      return 'Each participant amount must be greater than 0.'
    }
    return null
  }

  function validateSplitTotals(totalAmount: number, participantTotal: number): string | null {
    const totalCents = Math.round(totalAmount * 100)
    const participantsCents = Math.round(participantTotal * 100)
    if (participantsCents > totalCents) {
      return 'Participant shares cannot exceed total amount.'
    }
    return null
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

    if (splitEnabled) {
      if (selectedParticipantIds.length === 0) {
        participantsError = 'Select at least one friend.'
        return
      }

      for (const participant of participantSplits) {
        const participantValidation = validateParticipantAmount(participant.amount)
        if (participantValidation) {
          participantsError = participantValidation
          return
        }
      }

      const totalsValidation = validateSplitTotals(parsedAmount, participantSum)
      if (totalsValidation) {
        participantsError = totalsValidation
        return
      }
    }

    submitting = true
    try {
      if (splitEnabled) {
        const splitPayload: CreateSplitPayload = {
          idempotency_key: splitIdempotencyKey,
          total_amount: parsedAmount,
          description: normalizedName,
          date: normalizedDate,
          category_id: categoryId,
          splits: participantSplits,
        }

        await createSplit(splitPayload)
      } else {
        const normalizedAmount = isIncome ? parsedAmount : -parsedAmount
        await createRecord({
          name: normalizedName,
          amount: normalizedAmount,
          category_id: categoryId,
          date: normalizedDate,
        })
      }

      invalidateRecordsCache()

      name = ''
      amountInput = ''
      categoryId = ''
      date = todayIso()
      if (splitEnabled) {
        splitEnabled = false
        splitIdempotencyKey = generateIdempotencyKey()
        resetParticipantState(friends)
        toast.success('Split created.')
      } else {
        toast.success('Record added successfully.')
      }
    } catch (error) {
      const apiError = error as ApiError
      if (apiError.status === 401) {
        await goto('/login')
        return
      }
      if (splitEnabled && apiError.status === 409) {
        splitIdempotencyKey = generateIdempotencyKey()
        toast.error('Duplicate key conflict — please try again.')
        return
      }
      toast.error(
        getErrorMessage(
          error,
          splitEnabled ? 'Unable to create split.' : 'Unable to create record.',
        ),
      )
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

      <Collapsible.Root bind:open={splitEnabled} onOpenChange={onSplitOpenChange}>
        <Collapsible.Trigger class="control split-toggle">
          <span>Split this expense</span>
          <span class="split-chevron" aria-hidden="true">›</span>
        </Collapsible.Trigger>

        <Collapsible.Content class="split-content">
          <div class="split-section">
            {#if friendsLoading}
              <p class="split-empty">Loading friends...</p>
            {:else if friends.length === 0}
              <p class="split-empty">No accepted friends yet.</p>
            {:else}
              {#each friends as friend (friend.id)}
                {@const selected = Boolean(participantIncluded[friend.user_id])}
                <div
                  class="participant-row"
                  class:participant-row--selected={selected}
                  role="checkbox"
                  aria-checked={selected}
                  tabindex="0"
                  on:click={() => toggleParticipant(friend.user_id)}
                  on:keydown={(e) => onParticipantRowKeydown(e, friend.user_id)}
                >
                  <span class="participant-name">{getFriendLabel(friend)}</span>
                  {#if selected}
                    <input
                      type="number"
                      class="participant-amount"
                      step="0.01"
                      min="0"
                      value={participantAmountInputs[friend.user_id] ?? ''}
                      on:input={(e) => onParticipantAmountInput(e, friend.user_id)}
                      on:click={onAmountInputClick}
                    />
                  {/if}
                </div>
              {/each}
            {/if}

            {#if participantsError}
              <p role="alert" class="split-error">{participantsError}</p>
            {/if}

            {#if selectedParticipantIds.length > 0}
              <p class="split-footer">
                Friends: {formatAmount(participantSum)} · Your share: {formatAmount(yourShare)}
              </p>
            {/if}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>

      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting
          ? splitEnabled
            ? 'Creating...'
            : 'Saving...'
          : splitEnabled
            ? 'Create split'
            : 'Save record'}
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

  /* --- Collapsible trigger --- */
  :global(.split-toggle) {
    justify-content: space-between;
    color: var(--text-muted);
    font-size: 13px;
  }

  :global(.split-toggle:hover) {
    border-color: var(--accent);
    color: var(--text);
  }

  :global(.split-toggle[data-state='open']) {
    border-color: var(--accent);
    color: var(--text);
  }

  .split-chevron {
    display: inline-block;
    font-size: 18px;
    line-height: 1;
    color: var(--text-muted);
    /* closed: points right (›); open: points down — rotate via data-state on parent */
  }

  :global(.split-toggle[data-state='open']) .split-chevron {
    transform: rotate(90deg);
    color: var(--accent);
  }

  /* --- Collapsible content panel --- */
  :global(.split-content) {
    border: 1px solid var(--border);
    border-top: none;
  }

  .split-section {
    display: grid;
    gap: 0;
  }

  /* --- Participant rows --- */
  .participant-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 44px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    user-select: none;
  }

  .participant-row:last-of-type {
    border-bottom: none;
  }

  .participant-row:hover {
    background: var(--panel);
  }

  .participant-row--selected {
    background: var(--panel);
    border-left: 2px solid var(--accent);
  }

  .participant-row--selected:hover {
    background: var(--panel-strong);
  }

  .participant-name {
    font-size: 13px;
    color: var(--text);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .participant-amount {
    width: 90px;
    height: 32px;
    padding: 0 10px;
    text-align: right;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    font: inherit;
    font-size: 13px;
    border-radius: 0;
    flex-shrink: 0;
  }

  .participant-amount:focus {
    border-color: var(--accent);
    outline: none;
  }

  /* --- Empty / error / footer states --- */
  .split-empty {
    padding: 12px 16px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .split-error {
    margin: 0;
    border-top: 1px solid var(--border);
  }

  .split-footer {
    padding: 10px 16px;
    border-top: 1px solid var(--border);
    background: var(--panel);
    color: var(--text-muted);
    font-size: 12px;
  }
</style>
