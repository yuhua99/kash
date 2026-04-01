import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export type AmountDisplayMode = 'cents' | 'whole'

const STORAGE_KEY = 'kash_amount_display_mode'

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
 * - 'cents': two decimal places, e.g. "123.45"
 * - 'whole': truncated integer, e.g. "123"
 *
 * Sign is preserved in both modes: formatAmount(-123.9, 'whole') → "-123"
 */
export function formatAmount(value: number, mode: AmountDisplayMode): string {
  const normalizedValue = value === 0 ? 0 : value

  if (mode === 'whole') {
    return String(Math.trunc(normalizedValue))
  }

  return normalizedValue.toFixed(2)
}

export function formatSignedAmount(value: number, mode: AmountDisplayMode): string {
  if (value > 0) {
    return `+${formatAmount(Math.abs(value), mode)}`
  }

  if (value < 0) {
    return `-${formatAmount(Math.abs(value), mode)}`
  }

  return formatAmount(0, mode)
}
