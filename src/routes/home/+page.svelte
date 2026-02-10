<script lang="ts">
  import QuickAddForm from '$lib/features/records/components/QuickAddForm.svelte'
  import type { Category } from '$lib/core/domain/models'
  import type { PageData } from './$types'

  type HomePageData = PageData & { categories: Category[]; loadError?: string }

  export let data: HomePageData

  let categories = data.categories
  let loadError = data.loadError ?? ''

  $: if (data) {
    categories = data.categories
    loadError = data.loadError ?? ''
  }
</script>

<main>
  <QuickAddForm {categories} {loadError} />
</main>
