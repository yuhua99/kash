<script lang="ts">
	import { goto } from '$app/navigation';
	import type { DateValue } from '@internationalized/date';
	import {
		deleteRecord,
		getCategories,
		getRecords,
		updateRecord
	} from '$lib/api';
	import { Button, DatePicker, DropdownMenu, Select } from 'bits-ui';
	import {
		dateValueToIso,
		isoToDateValue,
		periodFromPreset,
		type PeriodPreset
	} from '$lib/date';
	import type { Category, RecordItem } from '$lib/types';
	import {
		validateAmount,
		validateDate,
		validateRecordName,
		validateSearchTerm
	} from '$lib/validation';
	import PeriodControls from '$lib/components/PeriodControls.svelte';
	import { onMount } from 'svelte';

	type ApiError = Error & { status?: number };
	type SortMode = 'date_desc' | 'date_asc' | 'category_asc' | 'amount_desc' | 'amount_asc';
	type TypeFilter = 'all' | 'income' | 'expense';
	type SelectOption = {
		value: string;
		label: string;
	};

	const initialRange = periodFromPreset('month');

	let records: RecordItem[] = [];
	let categories: Category[] = [];
	let loading = true;
	let loadError = '';
	let mutationError = '';
	let successMessage = '';

	let periodPreset: PeriodPreset = 'month';
	let startDate = initialRange.start;
	let endDate = initialRange.end;

	let search = '';
	let categoryFilter = 'all';
	let typeFilter: TypeFilter = 'all';
	let sortMode: SortMode = 'date_desc';

	let editingId: string | null = null;
	let editName = '';
	let editAmountInput = '';
	let editCategoryId = '';
	let editDate = '';

	let editNameError = '';
	let editAmountError = '';
	let editCategoryError = '';
	let editDateError = '';

	let savingEdit = false;
	let deletingId: string | null = null;

	const typeFilterOptions: SelectOption[] = [
		{ value: 'all', label: 'All' },
		{ value: 'income', label: 'Income' },
		{ value: 'expense', label: 'Expense' }
	];

	const sortOptions: Array<{ value: SortMode; label: string }> = [
		{ value: 'date_desc', label: 'Date (newest)' },
		{ value: 'date_asc', label: 'Date (oldest)' },
		{ value: 'category_asc', label: 'Category' },
		{ value: 'amount_desc', label: 'Amount (high to low)' },
		{ value: 'amount_asc', label: 'Amount (low to high)' }
	];

	$: normalizedSearchTerm = search.trim();
	$: searchValidationError = validateSearchTerm(normalizedSearchTerm) ?? '';
	$: normalizedSearch = normalizedSearchTerm.toLowerCase();
	$: categoryById = new Map(categories.map((item) => [item.id, item]));
	$: categoryFilterLabel =
		categoryFilter === 'all'
			? 'All categories'
			: categories.find((category) => category.id === categoryFilter)?.name ?? 'All categories';
	$: typeFilterLabel =
		typeFilterOptions.find((option) => option.value === typeFilter)?.label ?? 'All';
	$: sortModeLabel =
		sortOptions.find((option) => option.value === sortMode)?.label ?? 'Date (newest)';
	$: editCategoryLabel =
		categories.find((category) => category.id === editCategoryId)?.name ?? 'Choose category';
	$: editDateValue = isoToDateValue(editDate);
	$: filteredRecords = records
		.filter((record) => matchesRecordFilters(record, normalizedSearch))
		.sort((left, right) => compareRecords(left, right, sortMode, categoryById));

	function matchesRecordFilters(record: RecordItem, normalizedSearchValue: string): boolean {
		if (normalizedSearchValue && !record.name.toLowerCase().includes(normalizedSearchValue)) {
			return false;
		}

		if (categoryFilter !== 'all' && record.category_id !== categoryFilter) {
			return false;
		}

		if (typeFilter === 'income') {
			return record.amount > 0;
		}

		if (typeFilter === 'expense') {
			return record.amount < 0;
		}

		return true;
	}

	function compareRecords(
		left: RecordItem,
		right: RecordItem,
		mode: SortMode,
		categoriesById: Map<string, Category>
	): number {
		switch (mode) {
			case 'date_asc':
				return left.date.localeCompare(right.date);
			case 'date_desc':
				return right.date.localeCompare(left.date);
			case 'amount_asc':
				return left.amount - right.amount;
			case 'amount_desc':
				return right.amount - left.amount;
			case 'category_asc': {
				const leftName = categoriesById.get(left.category_id)?.name ?? '';
				const rightName = categoriesById.get(right.category_id)?.name ?? '';
				return leftName.localeCompare(rightName);
			}
		}
	}

	function clearMutationFeedback(): void {
		mutationError = '';
		successMessage = '';
	}

	function getErrorMessage(error: unknown, fallbackMessage: string): string {
		return error instanceof Error ? error.message : fallbackMessage;
	}

	function clearEditErrors(): void {
		editNameError = '';
		editAmountError = '';
		editCategoryError = '';
		editDateError = '';
	}

	function validateEditForm(): boolean {
		clearEditErrors();
		const parsedAmount = Number(editAmountInput);
		const selectedCategory = categories.find((item) => item.id === editCategoryId);

		const nameValidation = validateRecordName(editName.trim());
		const amountValidation = validateAmount(parsedAmount);
		const dateValidation = validateDate(editDate.trim());

		if (nameValidation) editNameError = nameValidation;
		if (amountValidation) editAmountError = amountValidation;
		if (dateValidation) editDateError = dateValidation;
		if (!selectedCategory) editCategoryError = 'Choose a category.';

		if (
			selectedCategory &&
			parsedAmount !== 0 &&
			((parsedAmount > 0 && !selectedCategory.is_income) ||
				(parsedAmount < 0 && selectedCategory.is_income))
		) {
			editCategoryError = 'Selected category does not match amount type.';
		}

		return !(editNameError || editAmountError || editCategoryError || editDateError);
	}

	async function fetchData(): Promise<void> {
		loading = true;
		loadError = '';

		try {
			const [recordsResponse, categoriesResponse] = await Promise.all([
				getRecords({
					start_date: startDate,
					end_date: endDate,
					limit: 1000,
					offset: 0
				}),
				getCategories({ limit: 1000, offset: 0 })
			]);

			records = recordsResponse.records;
			categories = categoriesResponse.categories;
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			loadError = getErrorMessage(error, 'Unable to load records.');
		} finally {
			loading = false;
		}
	}

	function startEdit(record: RecordItem): void {
		editingId = record.id;
		editName = record.name;
		editAmountInput = String(record.amount);
		editCategoryId = record.category_id;
		editDate = record.date;
		clearEditErrors();
		clearMutationFeedback();
	}

	function cancelEdit(): void {
		editingId = null;
		clearEditErrors();
	}

	function onCategoryFilterChange(nextCategoryId: string): void {
		categoryFilter = nextCategoryId;
	}

	function onTypeFilterChange(nextType: string): void {
		typeFilter = nextType as TypeFilter;
	}

	function onSortModeChange(nextSortMode: string): void {
		sortMode = nextSortMode as SortMode;
	}

	function onEditCategoryChange(nextCategoryId: string): void {
		editCategoryId = nextCategoryId;
		editCategoryError = '';
	}

	function onEditDateChange(nextDate: DateValue | undefined): void {
		editDate = dateValueToIso(nextDate);
		editDateError = '';
	}

	async function saveEdit(): Promise<void> {
		if (!editingId) {
			return;
		}

		clearMutationFeedback();

		if (!validateEditForm()) {
			return;
		}

		savingEdit = true;
		try {
			await updateRecord(editingId, {
				name: editName.trim(),
				amount: Number(editAmountInput),
				category_id: editCategoryId,
				date: editDate.trim()
			});
			editingId = null;
			successMessage = 'Record updated.';
			await fetchData();
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			mutationError = getErrorMessage(error, 'Unable to update record.');
		} finally {
			savingEdit = false;
		}
	}

	async function removeRecord(id: string): Promise<void> {
		if (!confirm('Delete this record?')) {
			return;
		}

		clearMutationFeedback();
		deletingId = id;

		try {
			await deleteRecord(id);
			successMessage = 'Record deleted.';
			if (editingId === id) {
				editingId = null;
			}
			await fetchData();
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			mutationError = getErrorMessage(error, 'Unable to delete record.');
		} finally {
			deletingId = null;
		}
	}

	async function onPeriodChange(
		event: CustomEvent<{ preset: PeriodPreset; start: string; end: string }>
	): Promise<void> {
		periodPreset = event.detail.preset;
		startDate = event.detail.start;
		endDate = event.detail.end;
		await fetchData();
	}

	onMount(function initRecordsPage(): void {
		void fetchData();
	});
</script>

<main class="stack" aria-labelledby="records-title">
	<section class="page-card">
		<header class="stack">
			<p class="meta-text">Records</p>
			<h1 id="records-title">Search and manage records</h1>
		</header>

		<PeriodControls
			bind:preset={periodPreset}
			bind:start={startDate}
			bind:end={endDate}
			disabled={loading}
			on:change={onPeriodChange}
		/>

		<div class="stack">
			<div class="field">
				<label class="field-label" for="records-search">Search</label>
				<input
					id="records-search"
					class="text-input"
					type="search"
					placeholder="Search by record name"
					bind:value={search}
				/>
				{#if searchValidationError}
					<p class="field-error" role="alert">{searchValidationError}</p>
				{/if}
			</div>

			<div class="button-row">
				<div class="field" style="flex: 1 1 12rem">
					<label class="field-label" for="records-category-filter">Category</label>
					<Select.Root type="single" value={categoryFilter} onValueChange={onCategoryFilterChange}>
						<Select.Trigger id="records-category-filter" class="select-input">
							{categoryFilterLabel}
						</Select.Trigger>
						<Select.Portal>
							<Select.Content class="select-menu" sideOffset={6} align="start">
								<Select.Viewport>
									<Select.Item class="select-item" value="all" label="All categories">
										{#snippet children({ selected })}
											<span>All categories</span>
										{#if selected}
											<span aria-hidden="true">Selected</span>
										{/if}
										{/snippet}
									</Select.Item>
									{#each categories as category}
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
				</div>

				<div class="field" style="flex: 1 1 10rem">
					<label class="field-label" for="records-type-filter">Type</label>
					<Select.Root type="single" value={typeFilter} onValueChange={onTypeFilterChange}>
						<Select.Trigger id="records-type-filter" class="select-input">{typeFilterLabel}</Select.Trigger>
						<Select.Portal>
							<Select.Content class="select-menu" sideOffset={6} align="start">
								<Select.Viewport>
									{#each typeFilterOptions as option}
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

				<div class="field" style="flex: 1 1 12rem">
					<label class="field-label" for="records-sort">Sort</label>
					<Select.Root type="single" value={sortMode} onValueChange={onSortModeChange}>
						<Select.Trigger id="records-sort" class="select-input">{sortModeLabel}</Select.Trigger>
						<Select.Portal>
							<Select.Content class="select-menu" sideOffset={6} align="start">
								<Select.Viewport>
									{#each sortOptions as option}
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
			</div>
		</div>
	</section>

	<section class="page-card" aria-live="polite">
		{#if successMessage}
			<p class="success-banner" role="status">{successMessage}</p>
		{/if}

		{#if mutationError}
			<p class="error-banner" role="alert">{mutationError}</p>
		{/if}

		{#if loading}
			<p class="loading-banner">Loading records...</p>
		{:else if loadError}
			<p class="error-banner" role="alert">{loadError}</p>
		{:else if filteredRecords.length === 0}
			<p class="empty-banner">
				No matches. Add new records from
				<a class="inline-link" href="/home">Home</a>.
			</p>
		{:else}
			<div class="record-list">
				{#each filteredRecords as record}
					<article class="record-row">
						<div class="record-main">
							<strong class="record-name">{record.name}</strong>
							<div class="record-end">
								<strong class={record.amount > 0 ? 'amount-income' : 'amount-expense'}>
									{record.amount.toFixed(2)}
								</strong>
								{#if editingId !== record.id}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger
											class="record-actions-trigger"
											aria-label={`Actions for ${record.name}`}
										>
											Actions
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content class="record-actions-menu" sideOffset={6} align="end">
												<DropdownMenu.Item
													class="record-actions-item"
													onSelect={() => startEdit(record)}
												>
													Edit
												</DropdownMenu.Item>
												<DropdownMenu.Separator class="record-actions-separator" />
												<DropdownMenu.Item
													class="record-actions-item record-actions-item-danger"
													onSelect={() => void removeRecord(record.id)}
													disabled={deletingId === record.id}
												>
													{deletingId === record.id ? 'Deleting...' : 'Delete'}
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								{/if}
							</div>
						</div>
						<div class="record-sub">
							<span>{categoryById.get(record.category_id)?.name ?? 'Unknown category'}</span>
							<span>{record.date}</span>
						</div>

						{#if editingId === record.id}
							<div class="stack">
								<div class="field">
									<label class="field-label" for={`edit-name-${record.id}`}>Name</label>
									<input
										id={`edit-name-${record.id}`}
										class="text-input"
										type="text"
										bind:value={editName}
									/>
									{#if editNameError}
										<p class="field-error" role="alert">{editNameError}</p>
									{/if}
								</div>

								<div class="button-row">
									<div class="field" style="flex: 1 1 10rem">
										<label class="field-label" for={`edit-amount-${record.id}`}>Amount</label>
										<input
											id={`edit-amount-${record.id}`}
											class="text-input"
											type="number"
											step="0.01"
											bind:value={editAmountInput}
										/>
										{#if editAmountError}
											<p class="field-error" role="alert">{editAmountError}</p>
										{/if}
									</div>

									<div class="field" style="flex: 1 1 10rem">
										<label class="field-label" for={`edit-category-${record.id}`}>Category</label>
										<Select.Root type="single" value={editCategoryId} onValueChange={onEditCategoryChange}>
											<Select.Trigger id={`edit-category-${record.id}`} class="select-input">
												{editCategoryLabel}
											</Select.Trigger>
											<Select.Portal>
												<Select.Content class="select-menu" sideOffset={6} align="start">
													<Select.Viewport>
														<Select.Item class="select-item" value="" label="Choose category">
															{#snippet children({ selected })}
																<span>Choose category</span>
																{#if selected}
																	<span aria-hidden="true">Selected</span>
																{/if}
															{/snippet}
														</Select.Item>
														{#each categories as category}
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
										{#if editCategoryError}
											<p class="field-error" role="alert">{editCategoryError}</p>
										{/if}
									</div>

									<div class="field" style="flex: 1 1 10rem">
										<label class="field-label" for={`edit-date-${record.id}`}>Date</label>
										<DatePicker.Root value={editDateValue} onValueChange={onEditDateChange}>
											<DatePicker.Trigger id={`edit-date-${record.id}`} class="text-input date-trigger">
												{editDate || 'Pick a date'}
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
										{#if editDateError}
											<p class="field-error" role="alert">{editDateError}</p>
										{/if}
									</div>
								</div>

								<div class="button-row">
									<Button.Root
										type="button"
										class="button primary"
										onclick={saveEdit}
										disabled={savingEdit}
									>
										{savingEdit ? 'Saving...' : 'Save changes'}
									</Button.Root>
									<Button.Root type="button" class="button secondary" onclick={cancelEdit}>
										Cancel
									</Button.Root>
								</div>
							</div>
						{/if}
					</article>
				{/each}
			</div>
		{/if}
	</section>
</main>
