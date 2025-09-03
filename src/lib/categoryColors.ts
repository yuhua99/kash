// Rose Pine palettes: dawn (light) and moon (dark)
// Using accent hues for distinct category colors.
// Dawn accents: love, gold, rose, pine, foam, iris, leaf
const LIGHT_MODE_COLORS = [
  '#b4637a', // love
  '#ea9d34', // gold
  '#d7827e', // rose
  '#286983', // pine
  '#56949f', // foam
  '#907aa9', // iris
  '#6d8f89', // leaf
]

// Moon accents: love, gold, rose, pine, foam, iris, leaf
const DARK_MODE_COLORS = [
  '#eb6f92', // love
  '#f6c177', // gold
  '#ea9a97', // rose
  '#3e8fb0', // pine
  '#9ccfd8', // foam
  '#c4a7e7', // iris
  '#95b1ac', // leaf
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

export function getCategoryColor(categoryId: string, isDarkMode = false): string {
  const colors = isDarkMode ? DARK_MODE_COLORS : LIGHT_MODE_COLORS
  const hash = hashString(categoryId)
  const index = hash % colors.length
  return colors[index]
}
