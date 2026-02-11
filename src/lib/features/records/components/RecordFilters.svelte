<script lang="ts">
  import type { PeriodPreset } from '$lib/shared/date'
  import PeriodControls from '$lib/features/periods/components/PeriodControls.svelte'
  import SelectField from '$lib/ui/SelectField.svelte'

  type SelectOption = {
    value: string
    label: string
  }

  export let periodPreset: PeriodPreset
  export let startDate: string
  export let endDate: string
  export let loading = false

  export let search = ''
  export let searchValidationError = ''

  export let categoryFilter = 'all'
  export let categoryFilterLabel = ''
  export let categoryFilterItems: SelectOption[] = []

  export let sortMode = 'date_desc'
  export let sortModeLabel = ''
  export let sortOptions: SelectOption[] = []

  export let onPeriodChange: (
    event: CustomEvent<{ preset: PeriodPreset; start: string; end: string }>,
  ) => void
  export let onCategoryFilterChange: (value: string) => void
  export let onSortModeChange: (value: string) => void

  let filterOpen = false
  let dropdownEl: HTMLDivElement

  function toggleFilter(): void {
    filterOpen = !filterOpen
  }

  function onWindowClick(event: MouseEvent): void {
    if (filterOpen && dropdownEl && !dropdownEl.contains(event.target as Node)) {
      filterOpen = false
    }
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if (filterOpen && event.key === 'Escape') {
      filterOpen = false
    }
  }

  $: hasActiveFilter = categoryFilter !== 'all' || sortMode !== 'date_desc'
</script>

<svelte:window on:click={onWindowClick} on:keydown={onWindowKeydown} />

<div class="record-filters">
  <!-- Row 1: Period controls + Type selector -->
  <div class="record-filters__row">
    <div class="record-filters__period">
      <PeriodControls
        bind:preset={periodPreset}
        bind:start={startDate}
        bind:end={endDate}
        disabled={loading}
        on:change={onPeriodChange}
      />
    </div>
  </div>

  <!-- Row 2: Search + Filter dropdown -->
  <div class="record-filters__row">
    <div class="record-filters__search">
      <input id="records-search" type="search" placeholder="Search records…" bind:value={search} />
      {#if searchValidationError}
        <p class="record-filters__search-error" role="alert">{searchValidationError}</p>
      {/if}
    </div>

    <div class="record-filters__dropdown" bind:this={dropdownEl}>
      <button
        type="button"
        class="record-filters__dropdown-trigger"
        class:record-filters__dropdown-trigger--open={filterOpen}
        class:record-filters__dropdown-trigger--active={hasActiveFilter}
        on:click|stopPropagation={toggleFilter}
        aria-expanded={filterOpen}
        aria-haspopup="true"
        aria-label="Filter & sort options"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="square"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
      </button>

      {#if filterOpen}
        <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
        <div class="record-filters__dropdown-menu" on:click|stopPropagation>
          <div class="record-filters__dropdown-field">
            <label for="records-category-filter">Category</label>
            <SelectField
              id="records-category-filter"
              value={categoryFilter}
              label={categoryFilterLabel}
              items={categoryFilterItems}
              onValueChange={onCategoryFilterChange}
            />
          </div>

          <div class="record-filters__dropdown-field">
            <label for="records-sort">Sort</label>
            <SelectField
              id="records-sort"
              value={sortMode}
              label={sortModeLabel}
              items={sortOptions}
              onValueChange={onSortModeChange}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .record-filters {
    display: grid;
    gap: 8px;
  }

  .record-filters__row {
    display: flex;
    gap: 8px;
  }

  /* Row 1 — period controls */
  .record-filters__period {
    flex: 1 1 0%;
    min-width: 0;
  }

  /* Row 2 — search stretches, dropdown trigger is square */
  .record-filters__search {
    flex: 1 1 0%;
    min-width: 0;
    display: grid;
    gap: 6px;
  }

  .record-filters__search-error {
    font-size: 12px;
  }

  /* Dropdown wrapper */
  .record-filters__dropdown {
    position: relative;
    flex: 0 0 44px;
  }

  .record-filters__dropdown-trigger {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 0;
    transition:
      background-color 150ms linear,
      color 150ms linear,
      border-color 150ms linear;
  }

  .record-filters__dropdown-trigger:hover {
    color: var(--text);
  }

  .record-filters__dropdown-trigger--open {
    border-color: var(--accent);
    background: var(--panel-strong);
    color: var(--text);
  }

  .record-filters__dropdown-trigger--active {
    color: var(--accent);
  }

  .record-filters__dropdown-trigger--active.record-filters__dropdown-trigger--open {
    color: var(--accent-strong);
  }

  /* Dropdown menu panel */
  .record-filters__dropdown-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    width: 260px;
    background: var(--panel);
    border: 1px solid var(--border);
    padding: 12px;
    display: grid;
    gap: 12px;
    z-index: 50;
  }

  .record-filters__dropdown-field {
    display: grid;
    gap: 6px;
  }

  /* Mobile */
  @media (max-width: 719px) {
    .record-filters__row {
      flex-wrap: wrap;
    }

    .record-filters__period {
      flex: 1 1 100%;
    }

    .record-filters__dropdown-menu {
      width: calc(100vw - 32px);
      right: auto;
      left: 50%;
      transform: translateX(-50%);
      /* Re-anchor: align to viewport center on small screens */
      position: fixed;
      top: auto;
      margin-top: 4px;
    }
  }
</style>
