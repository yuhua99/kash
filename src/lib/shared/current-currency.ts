import { browser } from '$app/environment'
import { writable } from 'svelte/store'
import {
  DEFAULT_CURRENCY_CODE,
  isSupportedCurrencyCode,
  type SupportedCurrencyCode,
} from '$lib/shared/currency'

const STORAGE_KEY = 'kash_current_currency'

function loadCurrency(): SupportedCurrencyCode {
  if (!browser) {
    return DEFAULT_CURRENCY_CODE
  }

  const storedValue = localStorage.getItem(STORAGE_KEY)
  if (storedValue && isSupportedCurrencyCode(storedValue)) {
    return storedValue
  }

  return DEFAULT_CURRENCY_CODE
}

const store = writable<SupportedCurrencyCode>(loadCurrency())

export const currentCurrency = {
  subscribe: store.subscribe,
}

export function setCurrentCurrency(currency: SupportedCurrencyCode): void {
  store.set(currency)
  if (browser) {
    localStorage.setItem(STORAGE_KEY, currency)
  }
}

export function initializeCurrentCurrency(defaultCurrency: string): void {
  if (!browser) {
    return
  }

  const storedValue = localStorage.getItem(STORAGE_KEY)
  if (storedValue && isSupportedCurrencyCode(storedValue)) {
    store.set(storedValue)
    return
  }

  const nextCurrency = isSupportedCurrencyCode(defaultCurrency)
    ? defaultCurrency
    : DEFAULT_CURRENCY_CODE
  setCurrentCurrency(nextCurrency)
}
