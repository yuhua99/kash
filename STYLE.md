# STYLE.md

## Visual Direction

This app uses a single, opinionated aesthetic: **Editorial Ledger**.

Think financial notebook meets modern magazine layout:
- Warm paper-like backgrounds, deep ink text, and assertive red accents.
- Oversized numeric typography for money, with precise spacing and tabular alignment.
- Minimal chrome, strong hierarchy, and asymmetric composition where it helps scanning.
- Calm by default, energetic on key interactions (submit, filter change, successful save).

Memorable signature:
- **Large, elegant money figures** (net totals and key amounts) paired with compact metadata.

This direction applies to all routes so the product feels cohesive.

## Non-Negotiable Rules

- Mobile-first is the baseline; desktop only enhances density and layout.
- Use Bits UI primitives whenever equivalent components exist.
- Do not rebuild primitive controls already covered by Bits UI.
- Use CSS variables for all colors, radii, shadows, spacing references, and focus styles.
- Avoid generic defaults (Inter, Roboto, Arial, bland white cards, purple gradients).
- Every interactive element must have visible hover, active, and focus-visible states.
- Minimum touch target: 44px height/width for tappable controls.

## Typography

Use a deliberate 3-font system:
- Display: `"Fraunces", "Times New Roman", serif`
- Body/UI: `"IBM Plex Sans", "Segoe UI", sans-serif`
- Numeric/data: `"IBM Plex Mono", "SFMono-Regular", monospace`

Type behavior:
- Money amounts and key totals use display font with `font-variant-numeric: tabular-nums lining-nums`.
- Dense metadata (dates, counts, filter labels) use mono font at smaller sizes.
- Body copy and form labels use UI font.

Scale (mobile-first):
- Hero amount: 2.25rem / 700 / tight tracking
- Section title: 1.125rem / 600
- Body: 0.95rem / 400
- Meta: 0.78rem / 500

## Color System

Use these semantic tokens (light theme only for v1):

```css
:root {
  --bg: #f4efe6;
  --bg-elevated: #fbf7f0;
  --panel: #fffaf2;
  --panel-strong: #f8f1e7;
  --ink: #16202a;
  --ink-muted: #4f5b66;
  --border: #d8ccbb;
  --accent: #c93f2a;
  --accent-ink: #7e1f12;
  --income: #176a52;
  --expense: #9a2a24;
  --focus: #1f6aa5;
  --success: #1d7a5b;
  --warning: #9f6a12;
  --danger: #a12c2a;
}
```

Usage rules:
- Background is never flat white.
- Primary action uses `--accent`; destructive uses `--danger`.
- Income values always use `--income`; expense values always use `--expense`.
- Borders are visible and intentional (no ghost UI).

## Surfaces, Borders, and Depth

- Corner radius scale:
  - `--radius-sm: 10px`
  - `--radius-md: 14px`
  - `--radius-lg: 20px`
- Border weight:
  - 1px default
  - 1.5px for primary cards and key controls
- Shadows:
  - Subtle, directional, warm-toned; avoid heavy blur.
- Panels should feel tactile (paper card on paper background), not glassmorphism.

## Spacing and Layout

Spacing scale:
- 4, 8, 12, 16, 20, 28, 36, 48

Page shell:
- Mobile: single-column flow, generous vertical rhythm.
- Desktop: same reading order, with wider gutters and optional secondary column.
- Max content widths:
  - Auth/home forms: 28rem
  - Data pages: 72rem

Navigation:
- Mobile: bottom nav is primary.
- Desktop: compact top rail or side rail is acceptable if information density improves without changing route mental model.

## Motion

Motion style: deliberate and editorial, not playful.

Required:
- Page enter reveal: 280-420ms, slight vertical offset + fade.
- Staggered child reveal for list items or cards (30-60ms offsets).
- Button press feedback (scale down 1-2% + quick settle).
- Success feedback after create/update/delete.

Respect accessibility:
- Implement `prefers-reduced-motion: reduce` and disable non-essential transitions.

## Component Styling Rules

Inputs/selects/textareas:
- Height >= 44px.
- Clear border contrast, visible focus ring (`--focus`).
- Inline error text below field, never as tooltip-only.

Buttons:
- Primary: solid accent with high contrast text.
- Secondary: panel background + border.
- Destructive: danger color with explicit label text.
- Avoid icon-only destructive actions on mobile unless confirmation is present.

Lists and tables:
- Records should scan quickly by amount/date/category.
- Use typographic hierarchy before adding color noise.
- Keep row actions discoverable but unobtrusive.

Dialogs/drawers:
- Use Bits UI dialog primitives.
- Confirmation dialogs for destructive actions (delete category/record).

## Route-Specific UI Direction

`/login` and `/register`
- Single, centered auth card with strong title and compact supporting copy.
- One primary CTA and clear link to the sibling auth route.
- Inline error messages near fields and form-level error at top.

`/home`
- Full-screen quick-add experience with one dominant form.
- Amount input is visually primary.
- On submit success: brief positive confirmation and full reset.

`/records`
- Filters appear before list: search, category, type, sort, date period.
- Date period controls match `/stats`.
- Record rows prioritize: amount, name, category, date.
- Editing uses inline panel or dialog; deleting requires confirmation.

`/categories`
- Category list grouped by income/expense.
- Create/edit flows are fast and minimal.
- Show conflict and dependency errors inline (for example, delete blocked by existing records).

`/stats`
- Net total is hero metric.
- Category breakdown is second-level with clear labeling and relative scale.
- Use same date period controls/presets as `/records`.
- Empty state explicitly explains missing data for selected period.

`/settings`
- Clear account/session section with logout action emphasized but not alarming.
- Keep layout sparse and utilitarian.

## States and Feedback

Loading:
- Use skeletons or structured placeholders that match final layout shape.

Empty:
- Include one sentence explaining the state and one suggested next action.

Errors:
- Human-readable, inline, and near the interaction point.
- 401-related failures must guide user back to login contextually.

Success:
- Short-lived, non-blocking confirmations for CRUD operations.

## Accessibility and Quality Bar

- WCAG AA contrast minimum for text and controls.
- Keyboard-navigable interactions across forms, filters, dialogs, and nav.
- Focus indicators are always visible and consistent.
- Form errors announced and associated with fields.
- Do not rely on color alone to communicate income/expense or errors.

## Implementation Constraints

- Prefer `$lib` helpers for API/date/types/validation.
- Refetch authoritative server data after create/update/delete.
- Keep `/records` and `/stats` period logic synchronized via `$lib/date`.
- Validate using `$lib/validation` and backend-aligned constraints from `API.md`.
- Build with SvelteKit + Tailwind v4 + Bits UI primitives.

## Prohibited Patterns

- Generic dashboard templates with interchangeable cards.
- Overuse of gradients, glows, and floating glass effects.
- Random animation on every element.
- Multiple visual languages across routes.
- Hidden validation messages or toast-only errors.

## Definition of Done (Style)

- All required routes share the same design language.
- Mobile experience feels complete without desktop.
- Desktop improves readability/density without changing flow.
- Money, dates, and categories are scannable within 2-3 seconds.
- Loading, empty, error, and success states are all visually designed.
- UI looks intentional and brandable, not scaffold-generated.
