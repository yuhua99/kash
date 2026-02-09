# STYLE.md

TUI-like, mobile-first, dark UI for Kash. Minimal, strict, and data-first. Use Bits UI primitives and style them into terminal panels.

## Design intent
- TUI aesthetic: clean grid, minimal ornament, clear separators, and dense information.
- Dark, high-contrast canvas based on the Vesper palette.
- Mono-only typography with tabular numbers for all currency and dates.
- Mobile-first: single-column flow, strong hierarchy, and touch-friendly controls.

## Vesper palette
Use these tokens and do not invent new colors.

```
:root {
  --bg: #101010;
  --surface: #161616;
  --panel: #1a1a1a;
  --panel-strong: #232323;
  --border: #282828;
  --text: #ffffff;
  --text-muted: #a0a0a0;
  --text-dim: #8a8a8a;
  --accent: #ffc799;
  --accent-strong: #ffd8b8;
  --success: #99ffe4;
  --danger: #ff8080;
  --selection: #ffffff25;
}
```

Usage
- Primary actions, focus rings, and active states use `--accent`.
- Income values use `--success`. Expense values use `--danger`.
- Default backgrounds use `--bg`. Inputs and cards use `--surface` or `--panel`.
- Borders are always `1px solid var(--border)`.

## Typography
- Primary font: `"IBM Plex Mono"`.
- Fallbacks: `"SF Mono"`, `Menlo`, `Monaco`, `Consolas`, `"Liberation Mono"`, `"Courier New"`, `monospace`.
- Use tabular numbers: `font-variant-numeric: tabular-nums;`.
- Weight: 400 body, 500 emphasis, 600 headings only.
- Line height: 1.45 body, 1.2 for headings.

Type scale (mobile-first)
- 18px: Page title.
- 16px: Section title.
- 14px: Body, inputs, list rows.
- 12px: Labels, helper text, metadata.
- 11px: Microcopy, timestamps.

## Layout and spacing
- Base rhythm: 8px grid. Only use 4, 8, 12, 16, 24, 32.
- Minimum touch target: 44px height.
- Single-column layout on mobile. Desktop can increase width but keep single-column flow.
- Use full-bleed list rows with 1px separators, no card shadows.

Panels and separators
- Use solid 1px borders, no rounded corners.
- Prefer dashed or double borders for emphasis in important panels.
- Use a single separator line between stacked sections.

## Components (Bits UI)
Use Bits UI components wherever available. Style them to look like terminal panels.

Buttons
- Primary: solid `--accent` background, `--bg` text, 1px border.
- Secondary: transparent background, `--accent` text, `--accent` border.
- Destructive: transparent background, `--danger` text, `--danger` border.
- Height 44px, no radius.

Inputs
- Background: `--surface`. Border: `--border`.
- Focus: 2px outline `--accent` or 1px border + outline.
- Placeholder: `--text-dim`.

Select, DatePicker, DropdownMenu
- Popovers use `--panel` with `--border`.
- Active option uses `--selection`.
- Selected option text uses `--accent`.

Menubar (primary nav)
- Fixed at top or bottom in mobile, use full-width.
- Active route: underline or border-bottom in `--accent`.

ListRow
- Use a 2px left border for type:
  - income: `--success`
  - expense: `--danger`
- Amounts right-aligned with tabular numbers.

Alerts and statuses
- Success text uses `--success`.
- Error text uses `--danger`.
- Loading uses muted text plus a simple ASCII indicator (e.g. "..." or ">>>").

## Interaction and motion
- Keep motion minimal. No decorative animations.
- Transitions: 120-180ms, linear or ease-out for focus/hover only.
- No parallax, no blurs, no shadows.

## Content and microcopy
- Use concise system-like language: "Saved", "Failed", "No records".
- Labels are short and literal. Avoid marketing tone.
- Use uppercase for small labels sparingly.

## Accessibility
- Contrast must meet WCAG AA.
- Focus state always visible and uses `--accent`.
- Keyboard navigation required for all Bits UI components.

## Route patterns
Login/Register
- Centered panel with minimal fields and a single primary action.

Home
- Full-screen quick add form. Large primary action at bottom.

Records
- Filters stacked above list. Sticky filters are allowed on scroll.
- Inline edit uses a bordered sub-panel.

Categories
- Simple list with add form at top. One action per row.

Stats
- Big numbers in mono, right-aligned. Use `--accent` for net total.

Settings
- Minimal list of actions with clear separators.

## Do not
- No gradients, no drop shadows, no rounded corners.
- No mixed font families.
- No decorative icons or illustrations.
- No purple or neon color accents outside the Vesper palette.
