<script lang="ts">
  import QuickAddForm from '$lib/features/records/components/QuickAddForm.svelte'
  import type { Category, RecordItem, UserSettings } from '$lib/core/domain/models'
  import type { PageData } from './$types'

  type HomePageData = PageData & {
    categories: Category[]
    recentRecords: RecordItem[]
    settings: UserSettings | null
    loadError?: string
  }

  export let data: HomePageData

  let categories = data.categories
  let recentRecords = data.recentRecords
  let settings = data.settings
  let loadError = data.loadError ?? ''

  $: if (data) {
    categories = data.categories
    recentRecords = data.recentRecords
    settings = data.settings
    loadError = data.loadError ?? ''
  }
</script>

<main>
  <QuickAddForm
    {categories}
    {recentRecords}
    mainCurrencyCode={settings?.main_currency}
    {loadError}
  />
</main>
