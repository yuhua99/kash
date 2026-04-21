import type { ExchangeRateRow } from '$lib/core/domain/models'

export type CurrencySubtotal = {
  currency: string
  total: number
}

type RateLookup = Map<string, number>

function buildRateKey(date: string, currency: string): string {
  return `${date}:${currency}`
}

export function buildRateLookup(rates: ExchangeRateRow[]): RateLookup {
  return new Map(rates.map((rate) => [buildRateKey(rate.date, rate.currency), rate.rate]))
}

export function convertAmountToMainCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date: string,
  rates: RateLookup,
): number {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const fromRate = rates.get(buildRateKey(date, fromCurrency))
  const toRate = rates.get(buildRateKey(date, toCurrency))

  if (fromRate === undefined) {
    throw new Error(`Missing FX rate for ${fromCurrency} on ${date}.`)
  }

  if (toRate === undefined) {
    throw new Error(`Missing FX rate for ${toCurrency} on ${date}.`)
  }

  return amount * (toRate / fromRate)
}

export function buildCurrencySubtotals<T extends { amount: number; currency: string }>(
  items: T[],
): CurrencySubtotal[] {
  const totals = new Map<string, number>()

  for (const item of items) {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amount)
  }

  return Array.from(totals.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((left, right) => left.currency.localeCompare(right.currency))
}
