# Architectural Decisions

## [2026-01-09T15:05:00Z] Session: ses_45ec43771ffec3bSLVlj8B82gy

### Decision 1: Global Background Color Change

**Context:** User wanted #e5e5e5 background matching demo

**Options Considered:**

- A) Change CSS variable globally (affects all views)
- B) Apply background only to Dashboard component

**Decision:** Option A - Global CSS variable change

**Rationale:**

- User confirmed "global" in requirements
- Matches demo's approach (body background)
- Maintains consistency across all views
- Easier to maintain (single source of truth)

**Implementation:** Modified `--bg-base` in `:root` section of main.css

---

### Decision 2: Header Removal Scope

**Context:** User wanted "no header" on dashboard

**Options Considered:**

- A) Conditional rendering (hide header only on dashboard route)
- B) Complete removal from App.vue (all authenticated pages)

**Decision:** Option B - Complete removal

**Rationale:**

- User explicitly said "remove header entirely"
- Demo has no navigation header at all
- User will handle navigation separately later
- Simpler implementation (no conditional logic)

**Trade-off:** Navigation to other views now requires manual URL entry or future implementation

---

### Decision 3: DashboardCard Component Design

**Context:** Need reusable card wrapper for 5 cards

**Options Considered:**

- A) Minimal wrapper (just slot, no props)
- B) Props for title, content, footer sections
- C) Variants for each card type

**Decision:** Option A - Minimal wrapper

**Rationale:**

- Maximum flexibility (each card controls its own layout)
- Easier to extend later without breaking changes
- Matches demo's approach (cards have varied internal structures)
- User requested "reusable for future views" - minimal design most reusable

**Implementation:**

```vue
<template>
  <div
    class="bg-white border border-black h-64 flex flex-col justify-between p-8 transition-colors duration-300"
  >
    <slot />
  </div>
</template>
```

---

### Decision 4: Current Month Calculation

**Context:** Balance card needs "current month net income"

**Options Considered:**

- A) Filter latestTransactions by current month timestamps
- B) Use existing periodTransactions with PeriodUnit.MONTH
- C) Create new composable for month filtering

**Decision:** Option A - Inline computed property

**Rationale:**

- Existing periodTransactions uses selected period (would need separate state)
- Inline computed is simple, self-contained
- No need for new composable (single-use case)
- Clear intent: "filter transactions for THIS month only"

**Implementation:** Computed property with Date arithmetic for month boundaries

---

### Decision 5: Last 5 Months Expense Bars

**Context:** Analytics card needs 5 monthly expense bars

**Options Considered:**

- A) Hardcode 5 bars, calculate on-the-fly
- B) Use existing trendSeries from useChartData
- C) Extract from monthlyAnalysis with placeholder handling

**Decision:** Option C - monthlyAnalysis with placeholders

**Rationale:**

- monthlyAnalysis already computes monthly breakdown
- Can handle < 5 months of data gracefully (placeholders)
- Slice last 5 with `.slice(-5)` for most recent data
- Scales bars relative to max expense (better visualization)

**Edge Case Handling:** If < 5 months, prepend placeholder bars at 10% height

---

### Decision 6: "VIEW ALL" Button Functionality

**Context:** Latest Activity has "VIEW ALL" button

**Options Considered:**

- A) Non-functional (visual only like Quick Add)
- B) Functional navigation to Transactions view

**Decision:** Option B - Functional navigation

**Rationale:**

- User explicitly confirmed "functional" in clarifications
- Provides escape hatch from headerless dashboard
- Uses Vue Router: `@click="$router.push('/transactions')"`
- Aligns with expected UX (button that says "VIEW ALL" should navigate)

---

### Non-Decisions (Deferred)

**Hover Effects:** User has "different plan" - skipped entirely (no .card-hover class)

**Quick Add Submit:** Visual only - no event handlers, no backend integration

**Savings Target Text:** Removed per user request (demo had it, we don't)

**Period Selector:** Removed entirely - fixed time periods only (current month for Balance, last 5 months for Analytics)
