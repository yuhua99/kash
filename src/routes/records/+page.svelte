<script lang="ts">
	import { goto } from '$app/navigation';
	import type { DateValue } from '@internationalized/date';
	import { Button, DatePicker, Select } from 'bits-ui';
	import {
		deleteRecord,
		getCategories,
		getRecords,
		updateRecord
	} from '$lib/api';
	import ListRow from '$lib/components/ListRow.svelte';
	import PeriodControls from '$lib/components/PeriodControls.svelte';
	import RowActionsMenu from '$lib/components/RowActionsMenu.svelte';
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

	function isTypeFilter(value: string): value is TypeFilter {
		return value === 'all' || value === 'income' || value === 'expense';
	}

	function isSortMode(value: string): value is SortMode {
		return (
			value === 'date_desc' ||
			value === 'date_asc' ||
			value === 'category_asc' ||
			value === 'amount_desc' ||
			value === 'amount_asc'
		);
	}

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

	function createEditHandler(record: RecordItem): () => void {
		return function handleEdit(): void {
			startEdit(record);
		};
	}

	function createDeleteHandler(recordId: string): () => void {
		return function handleDelete(): void {
			void removeRecord(recordId);
		};
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
		if (isTypeFilter(nextType)) {
			typeFilter = nextType;
		}
	}

	function onSortModeChange(nextSortMode: string): void {
		if (isSortMode(nextSortMode)) {
			sortMode = nextSortMode;
		}
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

<main>
	<section>
		<header>
			<p>Records</p>
		</header>

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
					<Select.Root type="single" value={categoryFilter} onValueChange={onCategoryFilterChange}>
						<Select.Trigger class="control" id="records-category-filter">
							{categoryFilterLabel}
						</Select.Trigger>
						<Select.Portal>
							<Select.Content class="popover" sideOffset={6} align="start">
								<Select.Viewport>
									<Select.Item value="all" label="All categories">
										{#snippet children({ selected })}
											<span>All categories</span>
										{#if selected}
											<span aria-hidden="true">Selected</span>
										{/if}
										{/snippet}
									</Select.Item>
									{#each categories as category}
										<Select.Item value={category.id} label={category.name}>
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

				<div>
					<label for="records-type-filter">Type</label>
					<Select.Root type="single" value={typeFilter} onValueChange={onTypeFilterChange}>
						<Select.Trigger class="control" id="records-type-filter">
							{typeFilterLabel}
						</Select.Trigger>
						<Select.Portal>
							<Select.Content class="popover" sideOffset={6} align="start">
								<Select.Viewport>
									{#each typeFilterOptions as option}
										<Select.Item value={option.value} label={option.label}>
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

				<div>
					<label for="records-sort">Sort</label>
					<Select.Root type="single" value={sortMode} onValueChange={onSortModeChange}>
						<Select.Trigger class="control" id="records-sort">
							{sortModeLabel}
						</Select.Trigger>
						<Select.Portal>
							<Select.Content class="popover" sideOffset={6} align="start">
								<Select.Viewport>
									{#each sortOptions as option}
										<Select.Item value={option.value} label={option.label}>
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

	<section aria-live="polite">
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
			<div>
				{#each filteredRecords as record}
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
							{#if editingId !== record.id}
						<RowActionsMenu
							ariaLabel={`Actions for ${record.name}`}
							onEdit={createEditHandler(record)}
							onDelete={createDeleteHandler(record.id)}
							deleting={deletingId === record.id}
						/>
							{/if}
						</div>
						<svelte:fragment slot="sub">
							<span>{categoryById.get(record.category_id)?.name ?? 'Unknown category'}</span>
							<span>{record.date}</span>
						</svelte:fragment>

						{#if editingId === record.id}
							<div>
								<div>
									<label for={`edit-name-${record.id}`}>Name</label>
									<input
										id={`edit-name-${record.id}`}
									
										type="text"
										bind:value={editName}
									/>
									{#if editNameError}
										<p role="alert">{editNameError}</p>
									{/if}
								</div>

								<div>
									<div>
										<label for={`edit-amount-${record.id}`}>Amount</label>
										<input
											id={`edit-amount-${record.id}`}
										
											type="number"
											step="0.01"
											bind:value={editAmountInput}
										/>
										{#if editAmountError}
											<p role="alert">{editAmountError}</p>
										{/if}
									</div>

									<div>
										<label for={`edit-category-${record.id}`}>Category</label>
								<Select.Root type="single" value={editCategoryId} onValueChange={onEditCategoryChange}>
									<Select.Trigger class="control" id={`edit-category-${record.id}`}>
										{editCategoryLabel}
									</Select.Trigger>
									<Select.Portal>
										<Select.Content class="popover" sideOffset={6} align="start">
													<Select.Viewport>
														<Select.Item value="" label="Choose category">
															{#snippet children({ selected })}
																<span>Choose category</span>
																{#if selected}
																	<span aria-hidden="true">Selected</span>
																{/if}
															{/snippet}
														</Select.Item>
														{#each categories as category}
															<Select.Item value={category.id} label={category.name}>
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
											<p role="alert">{editCategoryError}</p>
										{/if}
									</div>

									<div>
										<label for={`edit-date-${record.id}`}>Date</label>
								<DatePicker.Root value={editDateValue} onValueChange={onEditDateChange}>
									<DatePicker.Trigger
										class="control"
										id={`edit-date-${record.id}`}
										
										type="button"
									>
										{editDate || 'Pick a date'}
									</DatePicker.Trigger>
									<DatePicker.Portal>
										<DatePicker.Content class="popover" sideOffset={6} align="start">
											<DatePicker.Calendar class="calendar">
														{#snippet children({ months, weekdays })}
															<DatePicker.Header>
																<DatePicker.PrevButton aria-label="Previous month">
																	Prev
																</DatePicker.PrevButton>
																<DatePicker.Heading />
																<DatePicker.NextButton aria-label="Next month">
																	Next
																</DatePicker.NextButton>
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
							</div>
						{/if}
					</ListRow>
				{/each}
			</div>
		{/if}
	</section>
</main>
