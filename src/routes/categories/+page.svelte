<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Checkbox } from 'bits-ui';
	import { createCategory, deleteCategory, getCategories, updateCategory } from '$lib/api';
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
	let createIsIncome = false;
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
	$: createTypeLabel = createIsIncome ? 'Income category' : 'Expense category';

	function onCreateIncomeChange(checked: boolean): void {
		createIsIncome = checked;
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
			loadError = error instanceof Error ? error.message : 'Unable to load categories.';
		} finally {
			loading = false;
		}
	}

	async function onCreateSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		mutationError = '';
		successMessage = '';
		createNameError = '';

		const normalizedName = createName.trim();
		const validation = validateCategoryName(normalizedName);
		if (validation) {
			createNameError = validation;
			return;
		}

		creating = true;
		try {
			await createCategory({ name: normalizedName, is_income: createIsIncome });
			createName = '';
			successMessage = 'Category created.';
			await fetchCategories();
		} catch (error) {
			const apiError = error as ApiError;
			if (apiError.status === 401) {
				await goto('/login');
				return;
			}
			mutationError = error instanceof Error ? error.message : 'Unable to create category.';
		} finally {
			creating = false;
		}
	}

	function startEdit(category: Category): void {
		editingId = category.id;
		editName = category.name;
		editNameError = '';
		mutationError = '';
		successMessage = '';
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

		mutationError = '';
		successMessage = '';
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
			mutationError = error instanceof Error ? error.message : 'Unable to update category.';
		} finally {
			savingEdit = false;
		}
	}

	async function removeCategory(category: Category): Promise<void> {
		if (!confirm(`Delete category \"${category.name}\"?`)) {
			return;
		}

		mutationError = '';
		successMessage = '';
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
			mutationError = error instanceof Error ? error.message : 'Unable to delete category.';
		} finally {
			deletingId = null;
		}
	}

	onMount(() => {
		void fetchCategories();
	});
</script>

<main class="stack" aria-labelledby="categories-title">
	<section class="page-card">
		<header class="stack">
			<p class="meta-text">Categories</p>
			<h1 id="categories-title">Manage your income and expense buckets</h1>
			<p>Create categories fast, then rename or remove as your budget evolves.</p>
		</header>

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
				<div class="checkbox-row">
					<Checkbox.Root
						id="create-category-income"
						checked={createIsIncome}
						onCheckedChange={onCreateIncomeChange}
						class="checkbox-control"
					>
						{#snippet children({ checked })}
							<span class="checkbox-indicator" aria-hidden="true">{checked ? 'X' : ''}</span>
						{/snippet}
					</Checkbox.Root>
					<label class="field-label checkbox-label" for="create-category-income">Income category</label>
				</div>
				<p class="meta-text">{createTypeLabel}</p>
			</div>

			<Button.Root class="button primary" type="submit" disabled={creating}>
				{creating ? 'Creating...' : 'Create category'}
			</Button.Root>
		</form>
	</section>

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
								<article class="category-row">
									{#if editingId === category.id}
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
									{:else}
										<div class="record-main">
											<strong>{category.name}</strong>
											<span class="meta-text">Income</span>
										</div>
										<div class="button-row">
											<Button.Root type="button" class="button secondary" onclick={() => startEdit(category)}>
												Edit
											</Button.Root>
											<Button.Root
												type="button"
												class="button danger"
												onclick={() => removeCategory(category)}
												disabled={deletingId === category.id}
											>
												{deletingId === category.id ? 'Deleting...' : 'Delete'}
											</Button.Root>
										</div>
									{/if}
								</article>
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
								<article class="category-row">
									{#if editingId === category.id}
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
									{:else}
										<div class="record-main">
											<strong>{category.name}</strong>
											<span class="meta-text">Expense</span>
										</div>
										<div class="button-row">
											<Button.Root type="button" class="button secondary" onclick={() => startEdit(category)}>
												Edit
											</Button.Root>
											<Button.Root
												type="button"
												class="button danger"
												onclick={() => removeCategory(category)}
												disabled={deletingId === category.id}
											>
												{deletingId === category.id ? 'Deleting...' : 'Delete'}
											</Button.Root>
										</div>
									{/if}
								</article>
							{/each}
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</section>
</main>
