import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export type AmountDisplayMode = 'cents' | 'whole'

const STORAGE_KEY = 'kash_amount_display_mode'
const ZERO_DECIMAL_CURRENCIES = new Set(['IDR', 'JPY', 'KRW', 'TWD', 'VND'])

function loadMode(): AmountDisplayMode {
  if (!browser) return 'cents'
  return localStorage.getItem(STORAGE_KEY) === 'whole' ? 'whole' : 'cents'
}

const _modeStore = writable<AmountDisplayMode>(loadMode())

export const amountDisplayMode = {
  subscribe: _modeStore.subscribe,
}

export function setAmountDisplayMode(mode: AmountDisplayMode): void {
  _modeStore.set(mode)
  if (browser) localStorage.setItem(STORAGE_KEY, mode)
}

/**
 * Single shared formatter for all amount displays in the app.
 * - 'cents': currency decimals, e.g. "123.45" or "123" for TWD/JPY
 * - 'whole': truncated integer, e.g. "123"
 *
 * Sign is preserved in both modes: formatAmount(-123.9, 'whole') → "-123"
 */
export function formatAmount(value: number, mode: AmountDisplayMode, currency?: string): string {
  if (mode === 'whole') {
    return String(Math.trunc(value))
  }

  return value.toFixed(getCurrencyFractionDigits(currency))
}

export function formatSignedAmount(
  value: number,
  mode: AmountDisplayMode,
  currency?: string,
): string {
  if (value > 0) {
    return `+${formatAmount(Math.abs(value), mode, currency)}`
  }

  if (value < 0) {
    return `-${formatAmount(Math.abs(value), mode, currency)}`
  }

  return formatAmount(0, mode, currency)
}

function getCurrencyFractionDigits(currency?: string): number {
  if (!currency) {
    return 2
  }

  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) {
    return 0
  }

  return 2
}
