<script lang="ts">
  import { createEventDispatcher } from 'svelte'
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

  const dispatch = createEventDispatcher<{
    change: {
      preset: PeriodPreset
      start: string
      end: string
    }
  }>()

  const presetOptions: Array<{ value: PeriodPreset; label: string }> = [
    { value: 'month', label: 'This month' },
    { value: 'year', label: 'This year' },
    { value: 'custom', label: 'Custom range' },
  ]

  const presetLabels = new Map<PeriodPreset, string>(
    presetOptions.map((option) => [option.value, option.label]),
  )

  $: presetLabel = presetLabels.get(preset) ?? 'Select period'
  $: customRangeValue = getCustomRangeValue()
  $: customRangeLabel = start && end ? `${start} to ${end}` : 'Select date range'

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
    applyPreset(nextPreset as PeriodPreset)
  }

  function onCustomRangeChange(nextRange: DateRange): void {
    start = dateValueToIso(nextRange.start)
    end = dateValueToIso(nextRange.end)
    emitChange()
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

    const range = periodFromPreset(preset)
    start = range.start
    end = range.end
    emitChange()
  }
</script>

<section class="period-controls" aria-label="Period controls">
  <div>
    <label for="period-preset">Period</label>
    <SelectField
      id="period-preset"
      value={preset}
      label={presetLabel}
      items={presetOptions}
      {disabled}
      onValueChange={onPresetChange}
    />
  </div>

  {#if preset === 'custom'}
    <div>
      <label for="period-custom-range">Custom range</label>
      <DateRangePicker.Root
        value={customRangeValue}
        {disabled}
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
    </div>
  {:else}
    <p>{start} to {end}</p>
  {/if}
</section>
