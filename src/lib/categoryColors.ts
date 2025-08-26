const LIGHT_MODE_COLORS = [
  'hsl(0, 70%, 50%)', // Red
  'hsl(30, 70%, 50%)', // Orange
  'hsl(60, 70%, 50%)', // Yellow
  'hsl(120, 70%, 40%)', // Green
  'hsl(180, 70%, 45%)', // Cyan
  'hsl(240, 70%, 55%)', // Blue
  'hsl(270, 70%, 55%)', // Violet
  'hsl(330, 70%, 55%)', // Pink
] as const

const DARK_MODE_COLORS = [
  'hsl(0, 70%, 70%)', // Light Red
  'hsl(30, 70%, 70%)', // Light Orange
  'hsl(60, 70%, 75%)', // Bright Yellow
  'hsl(120, 70%, 65%)', // Light Green
  'hsl(180, 70%, 70%)', // Bright Cyan
  'hsl(240, 70%, 75%)', // Light Blue
  'hsl(270, 70%, 75%)', // Lavender
  'hsl(330, 70%, 75%)', // Light Pink
] as const

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getCategoryColor(categoryId: string, isDarkMode = false): string {
  const colors = isDarkMode ? DARK_MODE_COLORS : LIGHT_MODE_COLORS
  const hash = hashString(categoryId)
  const index = hash % colors.length
  return colors[index]
}

export function getCategoryColorHex(categoryId: string, isDarkMode = false): string {
  const hslColor = getCategoryColor(categoryId, isDarkMode)

  // Convert HSL to hex for use in places that need hex values
  const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!hslMatch) return '#6b7280' // fallback gray

  const [, h, s, l] = hslMatch.map(Number)
  return hslToHex(h, s / 100, l / 100)
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0,
    g = 0,
    b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
