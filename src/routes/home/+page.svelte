<script lang="ts">
  import QuickAddForm from '$lib/features/records/components/QuickAddForm.svelte'
  import type { Category, RecordItem } from '$lib/core/domain/models'
  import type { PageData } from './$types'

  type HomePageData = PageData & {
    categories: Category[]
    recentRecords: RecordItem[]
    loadError?: string
  }

  export let data: HomePageData

  let categories = data.categories
  let recentRecords = data.recentRecords
  let loadError = data.loadError ?? ''

  $: if (data) {
    categories = data.categories
    recentRecords = data.recentRecords
    loadError = data.loadError ?? ''
  }
</script>

<main>
  <QuickAddForm {categories} {recentRecords} {loadError} />
</main>
