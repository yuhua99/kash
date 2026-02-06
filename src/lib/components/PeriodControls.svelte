<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { DateRangePicker, Select, type DateRange } from 'bits-ui';
	import { dateValueToIso, isoToDateValue, periodFromPreset, type PeriodPreset } from '$lib/date';

	export let preset: PeriodPreset = 'month';
	export let start = '';
	export let end = '';
	export let disabled = false;

	const dispatch = createEventDispatcher<{
		change: {
			preset: PeriodPreset;
			start: string;
			end: string;
		};
	}>();

	const presetOptions: Array<{ value: PeriodPreset; label: string }> = [
		{ value: 'month', label: 'This month' },
		{ value: 'year', label: 'This year' },
		{ value: 'custom', label: 'Custom range' }
	];

	const presetLabels = new Map<PeriodPreset, string>(presetOptions.map((option) => [option.value, option.label]));

	$: presetLabel = presetLabels.get(preset) ?? 'Select period';
	$: customRangeValue = getCustomRangeValue();
	$: customRangeLabel = start && end ? `${start} to ${end}` : 'Select date range';

	function getCustomRangeValue(): DateRange | undefined {
		const startValue = isoToDateValue(start);
		const endValue = isoToDateValue(end);

		if (!startValue || !endValue) {
			return undefined;
		}

		return {
			start: startValue,
			end: endValue
		};
	}

	function onPresetChange(nextPreset: string): void {
		applyPreset(nextPreset as PeriodPreset);
	}

	function onCustomRangeChange(nextRange: DateRange): void {
		start = dateValueToIso(nextRange.start);
		end = dateValueToIso(nextRange.end);
		emitChange();
	}

	function emitChange(): void {
		dispatch('change', { preset, start, end });
	}

	function applyPreset(nextPreset: PeriodPreset): void {
		preset = nextPreset;

		if (preset === 'custom') {
			emitChange();
			return;
		}

		const range = periodFromPreset(preset);
		start = range.start;
		end = range.end;
		emitChange();
	}
</script>

<section class="stack" aria-label="Period controls">
	<div class="field">
		<label class="field-label" for="period-preset">Period</label>
		<Select.Root
			type="single"
			value={preset}
			disabled={disabled}
			onValueChange={onPresetChange}
			items={presetOptions}
		>
			<Select.Trigger id="period-preset" class="select-input">{presetLabel}</Select.Trigger>
			<Select.Portal>
				<Select.Content class="select-menu" sideOffset={6} align="start">
					<Select.Viewport>
						{#each presetOptions as option}
							<Select.Item class="select-item" value={option.value} label={option.label}>
								{#snippet children({ selected })}
									<span>{option.label}</span>
									{#if selected}
										<span aria-hidden="true">Selected</span>
									{/if}
								{/snippet}
							</Select.Item>
						{/each}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	</div>

	{#if preset === 'custom'}
		<div class="field">
			<label class="field-label" for="period-custom-range">Custom range</label>
			<DateRangePicker.Root
				value={customRangeValue}
				disabled={disabled}
				onValueChange={onCustomRangeChange}
				weekdayFormat="short"
				fixedWeeks={true}
			>
				<DateRangePicker.Trigger id="period-custom-range" class="text-input date-trigger">
					{customRangeLabel}
				</DateRangePicker.Trigger>
				<DateRangePicker.Content class="calendar-popover" sideOffset={6} align="start">
					<DateRangePicker.Calendar class="calendar-panel">
						{#snippet children({ months, weekdays })}
							<DateRangePicker.Header class="calendar-header">
								<DateRangePicker.PrevButton class="calendar-nav-button" aria-label="Previous month">
									Prev
								</DateRangePicker.PrevButton>
								<DateRangePicker.Heading class="calendar-heading" />
								<DateRangePicker.NextButton class="calendar-nav-button" aria-label="Next month">
									Next
								</DateRangePicker.NextButton>
							</DateRangePicker.Header>
							<div class="calendar-months">
								{#each months as month (month.value.toString())}
									<DateRangePicker.Grid class="calendar-grid">
										<DateRangePicker.GridHead>
											<DateRangePicker.GridRow>
												{#each weekdays as day}
													<DateRangePicker.HeadCell class="calendar-head-cell">{day}</DateRangePicker.HeadCell>
												{/each}
											</DateRangePicker.GridRow>
										</DateRangePicker.GridHead>
										<DateRangePicker.GridBody>
											{#each month.weeks as weekDates}
												<DateRangePicker.GridRow>
													{#each weekDates as date}
														<DateRangePicker.Cell {date} month={month.value}>
															<DateRangePicker.Day class="calendar-day range-day">{date.day}</DateRangePicker.Day>
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
		<p class="meta-text">{start} to {end}</p>
	{/if}
</section>
