// Rosé Pine palette via CSS variables.
const RP_ACCENT_VARS: string[] = [
  'var(--rp-love)',
  'var(--rp-gold)',
  'var(--rp-rose)',
  'var(--rp-pine)',
  'var(--rp-foam)',
  'var(--rp-iris)',
  'var(--rp-leaf)',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getCategoryColor(categoryId: string): string {
  const hash = hashString(categoryId)
  const index = hash % RP_ACCENT_VARS.length
  return RP_ACCENT_VARS[index]
}
