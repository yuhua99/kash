<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Collapsible, Tabs } from 'bits-ui';
	import { createCategory, deleteCategory, getCategories, updateCategory } from '$lib/api';
	import ListRow from '$lib/components/ListRow.svelte';
	import RowActionsMenu from '$lib/components/RowActionsMenu.svelte';
	import type { Category } from '$lib/types';
	import { validateCategoryName, validateSearchTerm } from '$lib/validation';
	import { onMount } from 'svelte';

	type ApiError = Error & { status?: number };

	let categories: Category[] = [];
	let loading = true;
	let loadError = '';
	let mutationError = '';
	let successMessage = '';

	let search = '';

	let createName = '';
	let createOpen = false;
	let createType: 'expense' | 'income' = 'expense';
	let createNameError = '';
	let creating = false;

	let editingId: string | null = null;
	let editName = '';
	let editNameError = '';
	let savingEdit = false;
	let deletingId: string | null = null;

	$: searchValidationError = validateSearchTerm(search.trim()) ?? '';
	$: normalizedSearch = search.trim().toLowerCase();
	$: visibleCategories = categories.filter((category) =>
		normalizedSearch ? category.name.toLowerCase().includes(normalizedSearch) : true
	);
	$: incomeCategories = visibleCategories.filter((category) => category.is_income);
	$: expenseCategories = visibleCategories.filter((category) => !category.is_income);

	function clearMutationFeedback(): void {
		mutationError = '';
		successMessage = '';
	}

	function getErrorMessage(error: unknown, fallbackMessage: string): string {
		return error instanceof Error ? error.message : fallbackMessage;
	}

	function createEditHandler(category: Category): () => void {
		return function handleEdit(): void {
			startEdit(category);
		};
	}

	function createDeleteHandler(category: Category): () => void {
		return function handleDelete(): void {
			void removeCategory(category);
		};
	}

	function onCreateTypeChange(nextValue: string): void {
		if (nextValue === 'income' || nextValue === 'expense') {
			createType = nextValue;
		}
	}

	async function fetchCategories(): Promise<void> {
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

	async function onCreateSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		clearMutationFeedback();
		createNameError = '';

		const normalizedName = createName.trim();
		const validation = validateCategoryName(normalizedName);
		if (validation) {
			createNameError = validation;
			return;
		}

		creating = true;
		try {
			const isIncome = createType === 'income';
			await createCategory({ name: normalizedName, is_income: isIncome });
			createName = '';
			successMessage = 'Category created.';
			await fetchCategories();
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			mutationError = getErrorMessage(error, 'Unable to create category.');
		} finally {
			creating = false;
		}
	}

	function startEdit(category: Category): void {
		editingId = category.id;
		editName = category.name;
		editNameError = '';
		clearMutationFeedback();
	}

	function cancelEdit(): void {
		editingId = null;
		editName = '';
		editNameError = '';
	}

	async function saveEdit(): Promise<void> {
		if (!editingId) {
			return;
		}

		clearMutationFeedback();
		editNameError = '';

		const normalizedName = editName.trim();
		const validation = validateCategoryName(normalizedName);
		if (validation) {
			editNameError = validation;
			return;
		}

		savingEdit = true;
		try {
			await updateCategory(editingId, { name: normalizedName });
			editingId = null;
			successMessage = 'Category updated.';
			await fetchCategories();
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			mutationError = getErrorMessage(error, 'Unable to update category.');
		} finally {
			savingEdit = false;
		}
	}

	async function removeCategory(category: Category): Promise<void> {
		if (!confirm(`Delete category "${category.name}"?`)) {
			return;
		}

		clearMutationFeedback();
		deletingId = category.id;

		try {
			await deleteCategory(category.id);
			successMessage = 'Category deleted.';
			await fetchCategories();
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			mutationError = getErrorMessage(error, 'Unable to delete category.');
		} finally {
			deletingId = null;
		}
	}

	onMount(function initCategoriesPage(): void {
		void fetchCategories();
	});
</script>

<main class="stack">
	<Collapsible.Root bind:open={createOpen} class="page-card">
		<Collapsible.Trigger class="collapsible-trigger">
			<span>Add category</span>
			<span class="collapsible-icon" aria-hidden="true"></span>
		</Collapsible.Trigger>
		<Collapsible.Content class="collapsible-content">
			{#if mutationError}
				<p class="error-banner" role="alert">{mutationError}</p>
			{/if}

			{#if successMessage}
				<p class="success-banner" role="status">{successMessage}</p>
			{/if}

			<form class="stack" on:submit={onCreateSubmit} novalidate>
				<div class="field">
					<label class="field-label" for="create-category-name">Category name</label>
					<input id="create-category-name" class="text-input" type="text" bind:value={createName} />
					{#if createNameError}
						<p class="field-error" role="alert">{createNameError}</p>
					{/if}
				</div>

				<div class="field">
					<p id="create-category-type" class="field-label">Type</p>
					<Tabs.Root value={createType} onValueChange={onCreateTypeChange} class="tabs">
						<Tabs.List class="tabs-list" aria-labelledby="create-category-type">
							<Tabs.Trigger class="tabs-trigger" value="expense">Expense</Tabs.Trigger>
							<Tabs.Trigger class="tabs-trigger" value="income">Income</Tabs.Trigger>
						</Tabs.List>
					</Tabs.Root>
				</div>

				<Button.Root class="button primary" type="submit" disabled={creating}>
					{creating ? 'Creating...' : 'Create category'}
				</Button.Root>
			</form>
		</Collapsible.Content>
	</Collapsible.Root>

	<section class="page-card" aria-live="polite">
		<div class="field">
			<label class="field-label" for="category-search">Search</label>
			<input
				id="category-search"
				class="text-input"
				type="search"
				placeholder="Search category names"
				bind:value={search}
			/>
			{#if searchValidationError}
				<p class="field-error" role="alert">{searchValidationError}</p>
			{/if}
		</div>

		{#if loading}
			<p class="loading-banner">Loading categories...</p>
		{:else if loadError}
			<p class="error-banner" role="alert">{loadError}</p>
		{:else if visibleCategories.length === 0}
			<p class="empty-banner">No categories found. Create one to start organizing records.</p>
		{:else}
			<div class="stack">
				<section class="stack" aria-labelledby="income-heading">
					<h2 class="section-title" id="income-heading">Income</h2>
					{#if incomeCategories.length === 0}
						<p class="empty-banner">No income categories yet.</p>
					{:else}
						<div class="category-list">
							{#each incomeCategories as category}
								{#if editingId === category.id}
									<ListRow type="income">
										<div class="field">
											<label class="field-label" for={`edit-category-${category.id}`}>Name</label>
											<input
												id={`edit-category-${category.id}`}
												class="text-input"
												type="text"
												bind:value={editName}
											/>
											{#if editNameError}
												<p class="field-error" role="alert">{editNameError}</p>
											{/if}
										</div>
										<div class="button-row">
											<Button.Root
												type="button"
												class="button primary"
												onclick={saveEdit}
												disabled={savingEdit}
											>
												{savingEdit ? 'Saving...' : 'Save'}
											</Button.Root>
											<Button.Root type="button" class="button secondary" onclick={cancelEdit}>
												Cancel
											</Button.Root>
										</div>
									</ListRow>
								{:else}
									<ListRow type="income">
										<strong slot="main" class="record-name">{category.name}</strong>
										<div slot="end">
										<RowActionsMenu
											ariaLabel={`Actions for ${category.name}`}
											onEdit={createEditHandler(category)}
											onDelete={createDeleteHandler(category)}
											deleting={deletingId === category.id}
										/>
										</div>
									</ListRow>
								{/if}
							{/each}
						</div>
					{/if}
				</section>

				<section class="stack" aria-labelledby="expense-heading">
					<h2 class="section-title" id="expense-heading">Expense</h2>
					{#if expenseCategories.length === 0}
						<p class="empty-banner">No expense categories yet.</p>
					{:else}
						<div class="category-list">
							{#each expenseCategories as category}
								{#if editingId === category.id}
									<ListRow type="expense">
										<div class="field">
											<label class="field-label" for={`edit-category-${category.id}`}>Name</label>
											<input
												id={`edit-category-${category.id}`}
												class="text-input"
												type="text"
												bind:value={editName}
											/>
											{#if editNameError}
												<p class="field-error" role="alert">{editNameError}</p>
											{/if}
										</div>
										<div class="button-row">
											<Button.Root
												type="button"
												class="button primary"
												onclick={saveEdit}
												disabled={savingEdit}
											>
												{savingEdit ? 'Saving...' : 'Save'}
											</Button.Root>
											<Button.Root type="button" class="button secondary" onclick={cancelEdit}>
												Cancel
											</Button.Root>
										</div>
									</ListRow>
								{:else}
									<ListRow type="expense">
										<strong slot="main" class="record-name">{category.name}</strong>
										<div slot="end">
										<RowActionsMenu
											ariaLabel={`Actions for ${category.name}`}
											onEdit={createEditHandler(category)}
											onDelete={createDeleteHandler(category)}
											deleting={deletingId === category.id}
										/>
										</div>
									</ListRow>
								{/if}
							{/each}
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</section>
</main>
