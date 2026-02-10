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

  export let typeFilter = 'all'
  export let typeFilterLabel = ''
  export let typeFilterOptions: SelectOption[] = []

  export let sortMode = 'date_desc'
  export let sortModeLabel = ''
  export let sortOptions: SelectOption[] = []

  export let onPeriodChange: (
    event: CustomEvent<{ preset: PeriodPreset; start: string; end: string }>,
  ) => void
  export let onCategoryFilterChange: (value: string) => void
  export let onTypeFilterChange: (value: string) => void
  export let onSortModeChange: (value: string) => void
</script>

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
      <SelectField
        id="records-category-filter"
        value={categoryFilter}
        label={categoryFilterLabel}
        items={categoryFilterItems}
        onValueChange={onCategoryFilterChange}
      />
    </div>

    <div>
      <label for="records-type-filter">Type</label>
      <SelectField
        id="records-type-filter"
        value={typeFilter}
        label={typeFilterLabel}
        items={typeFilterOptions}
        onValueChange={onTypeFilterChange}
      />
    </div>

    <div>
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
</div>
