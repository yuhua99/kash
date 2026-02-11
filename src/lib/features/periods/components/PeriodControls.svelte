<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { getLocalTimeZone, today, type DateValue } from '@internationalized/date'
  import { DateRangePicker, type DateRange } from 'bits-ui'
  import SelectField from '$lib/ui/SelectField.svelte'
  import '$lib/ui/Control.css'
  import '$lib/ui/DatePicker.css'
  import './PeriodControls.css'
  import {
    dateValueToIso,
    isoToDateValue,
    periodFromPreset,
    type PeriodPreset,
  } from '$lib/shared/date'

  export let preset: PeriodPreset = 'month'
  export let start = ''
  export let end = ''
  export let disabled = false

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const earliestYear = 2010
  const maxDate = today(getLocalTimeZone())

  const dispatch = createEventDispatcher<{
    change: {
      preset: PeriodPreset
      start: string
      end: string
    }
  }>()

  const presetOptions: Array<{ value: PeriodPreset; label: string }> = [
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'custom', label: 'Custom range' },
  ]

  const monthOptions = [
    { value: 1, label: 'January', shortLabel: 'Jan' },
    { value: 2, label: 'February', shortLabel: 'Feb' },
    { value: 3, label: 'March', shortLabel: 'Mar' },
    { value: 4, label: 'April', shortLabel: 'Apr' },
    { value: 5, label: 'May', shortLabel: 'May' },
    { value: 6, label: 'June', shortLabel: 'Jun' },
    { value: 7, label: 'July', shortLabel: 'Jul' },
    { value: 8, label: 'August', shortLabel: 'Aug' },
    { value: 9, label: 'September', shortLabel: 'Sep' },
    { value: 10, label: 'October', shortLabel: 'Oct' },
    { value: 11, label: 'November', shortLabel: 'Nov' },
    { value: 12, label: 'December', shortLabel: 'Dec' },
  ]

  const yearOptionValues = Array.from({ length: currentYear - earliestYear + 1 }, (_, index) =>
    String(currentYear - index),
  )

  let selectedMonth = currentMonth
  let selectedYear = currentYear
  let monthPickerOpen = false
  let monthPickerYear = currentYear
  let monthPickerEl: HTMLDivElement | null = null
  let customRangeOpen = false
  let customRangeRenderKey = 0
  let customRangeStartValue: DateValue | undefined
  let customRangeEndValue: DateValue | undefined

  const presetLabels = new Map<PeriodPreset, string>(
    presetOptions.map((option) => [option.value, option.label]),
  )

  $: presetLabel = presetLabels.get(preset) ?? 'Select period'
  $: customRangeValue = getCustomRangeValue()
  $: customRangeLabel = start && end ? `${start} to ${end}` : 'Select range'
  $: monthLabel =
    monthOptions.find((option) => option.value === selectedMonth)?.label ?? 'Select month'
  $: monthTriggerLabel = `${monthLabel} ${selectedYear}`
  $: disabledMonthValues =
    monthPickerYear < currentYear
      ? new Set<number>()
      : new Set<number>(
          monthOptions
            .filter((option) => option.value > currentMonth)
            .map((option) => option.value),
        )
  $: yearLabel = String(selectedYear)
  $: yearItems = yearOptionValues.map((value) => ({ value, label: value }))
  $: if (preset !== 'month') {
    monthPickerOpen = false
  }

  $: if (preset === 'month') {
    const monthFromStart = parseMonth(start)
    const yearFromStart = parseYear(start)
    if (monthFromStart && yearFromStart) {
      const clamped = clampMonthYear(yearFromStart, monthFromStart)
      if (selectedMonth !== clamped.month) {
        selectedMonth = clamped.month
      }
      if (selectedYear !== clamped.year) {
        selectedYear = clamped.year
      }
    }
  }

  $: if (preset === 'year') {
    const yearFromStart = parseYear(start)
    if (yearFromStart) {
      const clampedYear = clampYear(yearFromStart)
      if (selectedYear !== clampedYear) {
        selectedYear = clampedYear
      }
    }
  }

  function getCustomRangeValue(): DateRange | undefined {
    const startValue = isoToDateValue(start)
    const endValue = isoToDateValue(end)

    if (!startValue || !endValue) {
      return undefined
    }

    return {
      start: startValue,
      end: endValue,
    }
  }

  function onPresetChange(nextPreset: string): void {
    if (nextPreset === 'month' || nextPreset === 'year' || nextPreset === 'custom') {
      applyPreset(nextPreset)
    }
  }

  function onCustomRangeChange(nextRange: DateRange): void {
    if (!customRangeStartValue || !customRangeEndValue) {
      return
    }

    const nextStart = dateValueToIso(nextRange.start)
    const nextEnd = dateValueToIso(nextRange.end)

    if (nextStart === start && nextEnd === end) {
      return
    }

    start = nextStart
    end = nextEnd
    emitChange()
  }

  function onCustomRangeOpenChange(nextOpen: boolean): void {
    customRangeOpen = nextOpen

    if (nextOpen) {
      customRangeStartValue = customRangeValue?.start
      customRangeEndValue = customRangeValue?.end
      return
    }

    const hasPartialSelection =
      (customRangeStartValue && !customRangeEndValue) ||
      (!customRangeStartValue && customRangeEndValue)

    if (hasPartialSelection) {
      customRangeRenderKey += 1
    }

    customRangeStartValue = customRangeValue?.start
    customRangeEndValue = customRangeValue?.end
  }

  function onCustomRangeStartValueChange(nextStart: DateValue | undefined): void {
    customRangeStartValue = nextStart
  }

  function onCustomRangeEndValueChange(nextEnd: DateValue | undefined): void {
    customRangeEndValue = nextEnd
  }

  function onWindowClick(event: MouseEvent): void {
    if (!monthPickerOpen || !monthPickerEl) {
      return
    }

    if (!monthPickerEl.contains(event.target as Node)) {
      monthPickerOpen = false
    }
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if (monthPickerOpen && event.key === 'Escape') {
      monthPickerOpen = false
    }
  }

  function toggleMonthPicker(): void {
    if (disabled) {
      return
    }

    monthPickerYear = selectedYear
    monthPickerOpen = !monthPickerOpen
  }

  function onMonthPickerYearStep(step: number): void {
    monthPickerYear = clampYear(monthPickerYear + step)
  }

  function onMonthPick(month: number): void {
    if (disabled || disabledMonthValues.has(month)) {
      return
    }

    const clamped = clampMonthYear(monthPickerYear, month)
    selectedYear = clamped.year
    selectedMonth = clamped.month
    monthPickerYear = clamped.year
    monthPickerOpen = false

    if (preset === 'month') {
      applyMonthPeriod()
    }
  }

  function onYearChange(nextYear: string): void {
    const yearValue = Number(nextYear)
    if (!Number.isInteger(yearValue)) {
      return
    }

    selectedYear = clampYear(yearValue)

    if (selectedYear === currentYear && selectedMonth > currentMonth) {
      selectedMonth = currentMonth
    }

    if (preset === 'month') {
      applyMonthPeriod()
      return
    }

    if (preset === 'year') {
      applyYearPeriod()
    }
  }

  function emitChange(): void {
    dispatch('change', { preset, start, end })
  }

  function applyPreset(nextPreset: PeriodPreset): void {
    preset = nextPreset

    if (preset === 'custom') {
      emitChange()
      return
    }

    if (preset === 'month') {
      applyMonthPeriod()
      return
    }

    applyYearPeriod()
  }

  function applyMonthPeriod(): void {
    const clamped = clampMonthYear(selectedYear, selectedMonth)
    selectedYear = clamped.year
    selectedMonth = clamped.month

    const range = periodFromPreset('month', {
      year: selectedYear,
      month: selectedMonth,
    })
    start = range.start
    end = range.end
    emitChange()
  }

  function applyYearPeriod(): void {
    selectedYear = clampYear(selectedYear)
    const range = periodFromPreset('year', { year: selectedYear })
    start = range.start
    end = range.end
    emitChange()
  }

  function parseYear(value: string): number | null {
    const yearValue = Number(value.slice(0, 4))
    return Number.isInteger(yearValue) ? yearValue : null
  }

  function parseMonth(value: string): number | null {
    const monthValue = Number(value.slice(5, 7))
    return Number.isInteger(monthValue) && monthValue >= 1 && monthValue <= 12 ? monthValue : null
  }

  function clampYear(value: number): number {
    if (value > currentYear) {
      return currentYear
    }
    if (value < earliestYear) {
      return earliestYear
    }
    return value
  }

  function clampMonthYear(year: number, month: number): { year: number; month: number } {
    const clampedYear = clampYear(year)
    const clampedMonth = Math.min(12, Math.max(1, month))

    if (clampedYear === currentYear && clampedMonth > currentMonth) {
      return { year: clampedYear, month: currentMonth }
    }

    return { year: clampedYear, month: clampedMonth }
  }
</script>

<svelte:window on:click={onWindowClick} on:keydown={onWindowKeydown} />

<section class="period-controls" aria-label="Period controls">
  <div class="period-controls__preset-cell">
    <SelectField
      id="period-preset"
      value={preset}
      label={presetLabel}
      items={presetOptions}
      {disabled}
      onValueChange={onPresetChange}
    />
  </div>

  <div class="period-controls__value-cell">
    {#if preset === 'month'}
      <div class="period-controls__month-picker" bind:this={monthPickerEl}>
        <button
          id="period-month-picker"
          type="button"
          class="control period-controls__month-trigger"
          class:period-controls__month-trigger--open={monthPickerOpen}
          {disabled}
          aria-expanded={monthPickerOpen}
          aria-haspopup="true"
          aria-label="Select month"
          on:click|stopPropagation={toggleMonthPicker}
        >
          {monthTriggerLabel}
        </button>

        {#if monthPickerOpen}
          <div class="period-controls__month-menu">
            <div class="period-controls__month-menu-header">
              <button
                type="button"
                class="period-controls__month-year-nav"
                on:click={() => onMonthPickerYearStep(-1)}
                disabled={monthPickerYear <= earliestYear}
                aria-label="Previous year"
              >
                Prev
              </button>
              <span class="period-controls__month-menu-year">{monthPickerYear}</span>
              <button
                type="button"
                class="period-controls__month-year-nav"
                on:click={() => onMonthPickerYearStep(1)}
                disabled={monthPickerYear >= currentYear}
                aria-label="Next year"
              >
                Next
              </button>
            </div>

            <div class="period-controls__month-grid">
              {#each monthOptions as option (option.value)}
                <button
                  type="button"
                  class="period-controls__month-option"
                  class:period-controls__month-option--selected={selectedYear === monthPickerYear &&
                    selectedMonth === option.value}
                  disabled={disabledMonthValues.has(option.value)}
                  on:click={() => onMonthPick(option.value)}
                >
                  {option.shortLabel}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else if preset === 'year'}
      <div class="period-controls__year-select">
        <SelectField
          id="period-year"
          value={String(selectedYear)}
          label={yearLabel}
          items={yearItems}
          {disabled}
          onValueChange={onYearChange}
        />
      </div>
    {:else}
      <div class="period-controls__custom">
        {#key customRangeRenderKey}
          <DateRangePicker.Root
            value={customRangeValue}
            open={customRangeOpen}
            {disabled}
            maxValue={maxDate}
            onOpenChange={onCustomRangeOpenChange}
            onStartValueChange={onCustomRangeStartValueChange}
            onEndValueChange={onCustomRangeEndValueChange}
            onValueChange={onCustomRangeChange}
            weekdayFormat="short"
            fixedWeeks={true}
          >
            <DateRangePicker.Trigger class="control" id="period-custom-range" type="button">
              {customRangeLabel}
            </DateRangePicker.Trigger>
            <DateRangePicker.Content class="date-popover" sideOffset={6} align="start">
              <DateRangePicker.Calendar class="date-calendar">
                {#snippet children({ months, weekdays })}
                  <DateRangePicker.Header>
                    <DateRangePicker.PrevButton aria-label="Previous month">
                      Prev
                    </DateRangePicker.PrevButton>
                    <DateRangePicker.Heading />
                    <DateRangePicker.NextButton aria-label="Next month">
                      Next
                    </DateRangePicker.NextButton>
                  </DateRangePicker.Header>
                  <div>
                    {#each months as month (month.value.toString())}
                      <DateRangePicker.Grid>
                        <DateRangePicker.GridHead>
                          <DateRangePicker.GridRow>
                            {#each weekdays as day}
                              <DateRangePicker.HeadCell>{day}</DateRangePicker.HeadCell>
                            {/each}
                          </DateRangePicker.GridRow>
                        </DateRangePicker.GridHead>
                        <DateRangePicker.GridBody>
                          {#each month.weeks as weekDates}
                            <DateRangePicker.GridRow>
                              {#each weekDates as date}
                                <DateRangePicker.Cell {date} month={month.value}>
                                  <DateRangePicker.Day>{date.day}</DateRangePicker.Day>
                                </DateRangePicker.Cell>
                              {/each}
                            </DateRangePicker.GridRow>
                          {/each}
                        </DateRangePicker.GridBody>
                      </DateRangePicker.Grid>
                    {/each}
                  </div>
                {/snippet}
              </DateRangePicker.Calendar>
            </DateRangePicker.Content>
          </DateRangePicker.Root>
        {/key}
      </div>
    {/if}
  </div>
</section>
