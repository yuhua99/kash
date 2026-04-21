<script lang="ts">
  import { goto, invalidate } from '$app/navigation'
  import type { UserSettings } from '$lib/core/domain/models'
  import Button from '$lib/ui/Button.svelte'
  import { logout } from '$lib/features/auth/api'
  import { invalidateCategoriesCache } from '$lib/features/categories/cache'
  import { invalidateRecordsCache } from '$lib/features/records/cache'
  import { invalidateFriendsCache } from '$lib/features/friends/cache'
  import { updateSettings } from '$lib/features/settings/api'
  import {
    DEFAULT_CURRENCY_CODE,
    SUPPORTED_CURRENCIES,
    type SupportedCurrencyCode,
  } from '$lib/shared/currency'
  import {
    currentCurrency,
    initializeCurrentCurrency,
    setCurrentCurrency,
  } from '$lib/shared/current-currency'
  import { toast } from '$lib/ui/toast'
  import Block from '$lib/ui/Block.svelte'
  import ListRow from '$lib/ui/ListRow.svelte'
  import SelectField from '$lib/ui/SelectField.svelte'
  import { amountDisplayMode, setAmountDisplayMode } from '$lib/shared/amount-display'
  import type { PageData } from './$types'

  type SettingsPageData = PageData & {
    settings: UserSettings | null
    loadError?: string
  }

  export let data: SettingsPageData

  let pending = false
  let savingMainCurrency = false
  let mainCurrencyCode: SupportedCurrencyCode =
    (data.settings?.main_currency as SupportedCurrencyCode | undefined) ?? DEFAULT_CURRENCY_CODE
  let settingsLoadError = data.loadError ?? ''

  const currencyItems = SUPPORTED_CURRENCIES.map((currency) => ({
    value: currency.code,
    label: currency.code,
  }))

  $: if (data.settings?.main_currency && !savingMainCurrency) {
    mainCurrencyCode = data.settings.main_currency as SupportedCurrencyCode
  }

  $: if (data.settings?.main_currency) {
    initializeCurrentCurrency(data.settings.main_currency)
  }

  $: settingsLoadError = data.loadError ?? ''

  function toggleDisplayMode(): void {
    setAmountDisplayMode($amountDisplayMode === 'cents' ? 'whole' : 'cents')
  }

  function onCurrentCurrencyChange(value: string): void {
    setCurrentCurrency(value as SupportedCurrencyCode)
  }

  async function onMainCurrencyChange(value: string): Promise<void> {
    if (value === mainCurrencyCode) {
      return
    }

    savingMainCurrency = true
    const previousCurrencyCode = mainCurrencyCode
    mainCurrencyCode = value as SupportedCurrencyCode

    try {
      const settings = await updateSettings(mainCurrencyCode)
      mainCurrencyCode = settings.main_currency as SupportedCurrencyCode
      settingsLoadError = ''
      await invalidate('app:settings')
      toast.success('Main currency updated.')
    } catch (error) {
      mainCurrencyCode = previousCurrencyCode
      toast.error(error instanceof Error ? error.message : 'Unable to update main currency.')
    } finally {
      savingMainCurrency = false
    }
  }

  async function onLogout(): Promise<void> {
    pending = true

    try {
      await logout()
      invalidateCategoriesCache()
      invalidateRecordsCache()
      invalidateFriendsCache()
      await invalidate('app:auth')
      toast.success('Signed out.')
      await goto('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to logout.')
    } finally {
      pending = false
    }
  }
</script>

<main>
  <Block title="Settings">
    <button class="list-row list-row--link" onclick={() => goto('/settings/friends')}>
      <div class="list-row-main">
        <span>Friends</span>
        <span class="list-row-chevron">›</span>
      </div>
    </button>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Username</span>
        <span>{data.user?.username ?? 'Unknown'}</span>
      </svelte:fragment>
    </ListRow>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Amount format</span>
        <button class="format-toggle" type="button" onclick={toggleDisplayMode}>
          {$amountDisplayMode === 'cents' ? '123.45' : '123'}
        </button>
      </svelte:fragment>
    </ListRow>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Main currency</span>
      </svelte:fragment>
      <svelte:fragment slot="end">
        <div class="settings-inline-select">
          <SelectField
            id="main-currency"
            value={mainCurrencyCode}
            label={mainCurrencyCode}
            items={currencyItems}
            disabled={savingMainCurrency || !data.settings}
            align="end"
            onValueChange={onMainCurrencyChange}
          />
        </div>
      </svelte:fragment>
    </ListRow>

    <ListRow>
      <svelte:fragment slot="main">
        <span>Current currency</span>
      </svelte:fragment>
      <svelte:fragment slot="end">
        <div class="settings-inline-select">
          <SelectField
            id="current-currency"
            value={$currentCurrency}
            label={$currentCurrency}
            items={currencyItems}
            align="end"
            onValueChange={onCurrentCurrencyChange}
          />
        </div>
      </svelte:fragment>
    </ListRow>

    {#if settingsLoadError}
      <p class="settings-error">{settingsLoadError}</p>
    {/if}

    <Button variant="destructive" type="button" onclick={onLogout} disabled={pending}>
      {pending ? 'Signing out...' : 'Log out'}
    </Button>
  </Block>
</main>

<style>
  .list-row-chevron {
    color: var(--text-muted);
    font-size: 18px;
  }

  .format-toggle {
    background: var(--panel-strong);
    border: 1px solid var(--border);
    color: var(--accent);
    padding: 2px 8px;
    cursor: pointer;
  }

  .format-toggle:hover {
    border-color: var(--accent);
  }

  .settings-error {
    color: var(--danger);
    margin: 0;
  }

  .settings-inline-select {
    min-width: 84px;
  }

  .settings-inline-select :global(.select-trigger) {
    height: 28px;
    padding: 0 8px;
    background: var(--panel-strong);
  }
</style>
