import { useSettingsStore } from "@/stores/settings"

export const formatCurrency = (amount: number): string => {
  const settings = useSettingsStore()
  const fractionDigits = settings.showCents ? 2 : 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount)
}

export const formatSignedCurrency = (amount: number): string => {
  const sign = amount >= 0 ? "+" : "-"
  const abs = Math.abs(amount)
  return `${sign}${formatCurrency(abs)}`
}

export const formatPercent = (value: number, fractionDigits = 1): string =>
  `${value.toFixed(fractionDigits)}%`

export const formatDate = (timestampSeconds: number): string => {
  return new Date(timestampSeconds * 1000).toLocaleDateString()
}
