<script lang="ts">
	import { goto } from '$app/navigation';
	import type { DateValue } from '@internationalized/date';
	import { Button, DatePicker, Select } from 'bits-ui';
	import { createRecord, getCategories } from '$lib/api';
	import { dateValueToIso, isoToDateValue, todayIso } from '$lib/date';
	import type { Category } from '$lib/types';
	import { validateAmount, validateDate, validateRecordName } from '$lib/validation';
	import { onMount } from 'svelte';

	type ApiError = Error & { status?: number };
	type AmountType = 'income' | 'expense' | 'unknown';

	let categories: Category[] = [];
	let loading = true;
	let loadError = '';

	let name = '';
	let amountInput = '';
	let categoryId = '';
	let date = todayIso();

	let nameError = '';
	let amountError = '';
	let categoryError = '';
	let dateError = '';
	let formError = '';
	let successMessage = '';
	let submitting = false;

	$: parsedAmount = Number(amountInput);
	$: amountType = getAmountType(parsedAmount);
	$: filteredCategories = filterCategoriesByAmountType(categories, amountType);
	$: selectedCategoryLabel =
		filteredCategories.find((category) => category.id === categoryId)?.name ?? 'Choose category';
	$: dateValue = isoToDateValue(date);

	function getAmountType(amount: number): AmountType {
		if (amount > 0) {
			return 'income';
		}

		if (amount < 0) {
			return 'expense';
		}

		return 'unknown';
	}

	function filterCategoriesByAmountType(list: Category[], amountType: AmountType): Category[] {
		if (amountType === 'unknown') {
			return list;
		}

		const isIncomeAmount = amountType === 'income';
		return list.filter((item) => item.is_income === isIncomeAmount);
	}

	function clearValidationErrors(): void {
		nameError = '';
		amountError = '';
		categoryError = '';
		dateError = '';
	}

	function getErrorMessage(error: unknown, fallbackMessage: string): string {
		return error instanceof Error ? error.message : fallbackMessage;
	}

	function onCategoryChange(nextCategoryId: string): void {
		categoryId = nextCategoryId;
		categoryError = '';
	}

	function onDateChange(nextDate: DateValue | undefined): void {
		date = dateValueToIso(nextDate);
		dateError = '';
	}

	async function loadCategories(): Promise<void> {
		loading = true;
		loadError = '';

		try {
			const response = await getCategories({ limit: 1000, offset: 0 });
			categories = response.categories;
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			loadError = getErrorMessage(error, 'Unable to load categories.');
		} finally {
			loading = false;
		}
	}

	async function onSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		successMessage = '';
		formError = '';
		clearValidationErrors();

		const normalizedName = name.trim();
		const normalizedDate = date.trim();
		const selectedCategory = categories.find((item) => item.id === categoryId);

		const nameValidation = validateRecordName(normalizedName);
		const amountValidation = validateAmount(parsedAmount);
		const dateValidation = validateDate(normalizedDate);

		if (nameValidation) nameError = nameValidation;
		if (amountValidation) amountError = amountValidation;
		if (dateValidation) dateError = dateValidation;
		if (!selectedCategory) categoryError = 'Choose a category.';

		if (
			selectedCategory &&
			parsedAmount !== 0 &&
			((parsedAmount > 0 && !selectedCategory.is_income) ||
				(parsedAmount < 0 && selectedCategory.is_income))
		) {
			categoryError = 'Selected category does not match amount type.';
		}

		if (nameError || amountError || categoryError || dateError) {
			return;
		}

		submitting = true;
		try {
			await createRecord({
				name: normalizedName,
				amount: parsedAmount,
				category_id: categoryId,
				date: normalizedDate
			});

			name = '';
			amountInput = '';
			categoryId = '';
			date = todayIso();
			successMessage = 'Record added successfully.';
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			formError = getErrorMessage(error, 'Unable to create record.');
		} finally {
			submitting = false;
		}
	}

	onMount(function initHomePage(): void {
		void loadCategories();
	});
</script>

<main class="page-card" aria-labelledby="home-title">
	<header class="stack">
		<p class="meta-text">Quick add</p>
		<h1 id="home-title">Add a new record</h1>
		<p>Capture income and expenses immediately, then review full history in Records.</p>
	</header>

	{#if loading}
		<p class="loading-banner">Loading categories...</p>
	{:else if loadError}
		<p class="error-banner" role="alert">{loadError}</p>
	{:else if categories.length === 0}
		<p class="empty-banner">
			You do not have categories yet. Create one in
			<a href="/categories" class="inline-link">Categories</a>
			first.
		</p>
	{:else}
		{#if successMessage}
			<p class="success-banner" role="status">{successMessage}</p>
		{/if}

		{#if formError}
			<p class="error-banner" role="alert">{formError}</p>
		{/if}

		<form class="stack" on:submit={onSubmit} novalidate>
			<div class="field">
				<label class="field-label" for="record-name">Record name</label>
				<input id="record-name" class="text-input" type="text" bind:value={name} required />
				{#if nameError}
					<p class="field-error" role="alert">{nameError}</p>
				{/if}
			</div>

			<div class="field">
				<label class="field-label" for="record-amount">Amount</label>
				<input
					id="record-amount"
					class="text-input"
					type="number"
					step="0.01"
					bind:value={amountInput}
					placeholder="Use negative for expense"
					required
				/>
				{#if amountError}
					<p class="field-error" role="alert">{amountError}</p>
				{/if}
			</div>

			<div class="field">
				<label class="field-label" for="record-category">Category</label>
				<Select.Root type="single" value={categoryId} onValueChange={onCategoryChange}>
					<Select.Trigger id="record-category" class="select-input">{selectedCategoryLabel}</Select.Trigger>
					<Select.Portal>
						<Select.Content class="select-menu" sideOffset={6} align="start">
							<Select.Viewport>
								{#each filteredCategories as category}
									<Select.Item class="select-item" value={category.id} label={category.name}>
										{#snippet children({ selected })}
											<span>{category.name}</span>
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
				{#if categoryError}
					<p class="field-error" role="alert">{categoryError}</p>
				{/if}
			</div>

			<div class="field">
				<label class="field-label" for="record-date">Date</label>
				<DatePicker.Root value={dateValue} onValueChange={onDateChange}>
					<DatePicker.Trigger id="record-date" class="text-input date-trigger">
						{date || 'Pick a date'}
					</DatePicker.Trigger>
					<DatePicker.Portal>
						<DatePicker.Content class="calendar-popover" sideOffset={6} align="start">
							<DatePicker.Calendar class="calendar-panel">
								{#snippet children({ months, weekdays })}
									<DatePicker.Header class="calendar-header">
										<DatePicker.PrevButton class="calendar-nav-button" aria-label="Previous month">
											Prev
										</DatePicker.PrevButton>
										<DatePicker.Heading class="calendar-heading" />
										<DatePicker.NextButton class="calendar-nav-button" aria-label="Next month">
											Next
										</DatePicker.NextButton>
									</DatePicker.Header>
									<div class="calendar-months">
										{#each months as month (month.value.toString())}
											<DatePicker.Grid class="calendar-grid">
												<DatePicker.GridHead>
													<DatePicker.GridRow>
														{#each weekdays as day}
															<DatePicker.HeadCell class="calendar-head-cell">{day}</DatePicker.HeadCell>
														{/each}
													</DatePicker.GridRow>
												</DatePicker.GridHead>
												<DatePicker.GridBody>
													{#each month.weeks as weekDates}
														<DatePicker.GridRow>
															{#each weekDates as calendarDate}
																<DatePicker.Cell date={calendarDate} month={month.value}>
																	<DatePicker.Day class="calendar-day">{calendarDate.day}</DatePicker.Day>
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
					<p class="field-error" role="alert">{dateError}</p>
				{/if}
			</div>

			<Button.Root class="button primary" type="submit" disabled={submitting}>
				{submitting ? 'Saving...' : 'Save record'}
			</Button.Root>
		</form>
	{/if}
</main>
