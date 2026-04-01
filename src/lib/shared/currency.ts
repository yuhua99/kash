export type SupportedCurrencyCode = 'TWD' | 'USD' | 'JPY' | 'EUR' | 'CNY'

export type SupportedCurrency = {
  code: SupportedCurrencyCode
  fractionDigits: number
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  {
    code: 'TWD',
    fractionDigits: 0,
  },
  {
    code: 'USD',
    fractionDigits: 2,
  },
  {
    code: 'JPY',
    fractionDigits: 0,
  },
  {
    code: 'EUR',
    fractionDigits: 2,
  },
  {
    code: 'CNY',
    fractionDigits: 2,
  },
]

const currencyByCode = new Map(SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency]))

export const DEFAULT_CURRENCY_CODE: SupportedCurrencyCode = 'TWD'

export function isSupportedCurrencyCode(value: string): value is SupportedCurrencyCode {
  return currencyByCode.has(value as SupportedCurrencyCode)
}

export function getCurrencyConfig(code: SupportedCurrencyCode): SupportedCurrency {
  return currencyByCode.get(code) ?? currencyByCode.get(DEFAULT_CURRENCY_CODE)!
}

export function formatMoney(amount: number, currencyCode: SupportedCurrencyCode): string {
  const { fractionDigits } = getCurrencyConfig(currencyCode)
  const normalizedAmount = amount === 0 ? 0 : amount

  return normalizedAmount.toFixed(fractionDigits)
}

export function formatSignedMoney(amount: number, currencyCode: SupportedCurrencyCode): string {
  if (amount > 0) {
    return `+${formatMoney(Math.abs(amount), currencyCode)}`
  }

  if (amount < 0) {
    return `-${formatMoney(Math.abs(amount), currencyCode)}`
  }

  return formatMoney(0, currencyCode)
}
