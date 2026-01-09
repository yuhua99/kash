# Learnings from Brutalist Dashboard Redesign

## [2026-01-09T15:05:00Z] Session: ses_45ec43771ffec3bSLVlj8B82gy

### Discovered Patterns

**Vue 3 Component Structure:**

- Project uses `<script setup lang="ts">` syntax consistently
- Components import from `@/components/`, stores from `@/stores/`, composables from `@/composables/`
- DashboardCard component follows existing patterns (minimal wrapper with default slot)

**CSS Variable System:**

- Global styling uses CSS variables in `:root` (main.css)
- Variables: `--bg-base`, `--bg-interactive`, `--text-base`, `--text-muted`
- Changing `--bg-base` affects all pages globally (body background)

**Data Flow Architecture:**

- Stores: `useRecordsStore` provides `latestTransactions`
- Composables: `useFinancialCalculations` computes summaries, `useChartData` for visualizations
- Monthly analysis available via `monthlyAnalysis` computed property

**Typography Conventions:**

- Monospace labels: `font-mono text-xs uppercase tracking-widest`
- Large numbers: `text-5xl font-bold tracking-tighter`
- Tags/badges: `border border-black px-2 py-1`
- Muted text: Use `text-[var(--text-muted)]` instead of hardcoded `text-gray-500`

### Successful Approaches

**Current Month Filtering:**

```typescript
const currentMonthTransactions = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const startOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000)
  const endOfMonth = Math.floor(
    new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000,
  )

  return latestTransactions.value.filter(
    (t) => t.timestamp >= startOfMonth && t.timestamp <= endOfMonth,
  )
})
```

**Last 5 Months Expense Bars:**

- Slice `monthlyAnalysis` with `.slice(-5)` to get last 5 entries
- Calculate max expense for scaling: `Math.max(...last5.map(m => m.expenses), 1)`
- Compute height percentages relative to max
- Use placeholder bars (10% height) if less than 5 months of data

**Responsive Grid with Column Spanning:**

- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Latest Activity card: Add `md:col-span-2` directly to DashboardCard component
- Works across breakpoints: 1-col (mobile), 2-col (tablet with span), 3-col (desktop with span)

### Technical Decisions

**Why DashboardCard is Simple:**

- No props, just default slot for maximum flexibility
- Fixed height (h-64) and brutalist styling baked into component
- Allows card-specific layouts via slot content
- Can be extended later without breaking existing usage

**Why NO Target Text in Savings Card:**

- User explicitly requested removal of "Target: $5,000 by Feb 01" text
- Keeps card minimal and focused on current savings rate percentage

**Why "VIEW ALL" is Functional:**

- User confirmed button should navigate to Transactions view
- Uses `@click="$router.push('/transactions')"` for client-side routing
- Provides escape hatch from headerless dashboard

### Commands That Work

**TypeScript Type Checking:**

```bash
bun run lint:type-check
```

Always passes after file changes (no errors in implementation)

**Dev Server:**
Already running on http://localhost:5173 (PID 126284)

**Git Commits:**
All commits followed conventional commit format:

- `style:` for CSS variable change
- `refactor:` for structural changes (header removal, view rewrite)
- `feat:` for new component creation
