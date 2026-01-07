// Rosé Pine palette via CSS variables.
const RP_ACCENT_VARS: string[] = [
  "var(--rp-love)",
  "var(--rp-gold)",
  "var(--rp-rose)",
  "var(--rp-pine)",
  "var(--rp-foam)",
  "var(--rp-iris)",
  "var(--rp-leaf)",
];

export function getCategoryColor(categoryId: string): string {
  const hexSegment = categoryId.replace(/-/g, "").substring(0, 8);
  const index = parseInt(hexSegment, 16) % RP_ACCENT_VARS.length;
  return RP_ACCENT_VARS[index];
}
