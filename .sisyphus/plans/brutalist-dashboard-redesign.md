# Brutalist Dashboard Redesign

## Context

### Original Request

User wants to rewrite the entire frontend Dashboard view to match the style and layout of `ideas/budget-demo-22.html` - a minimalist brutalist design with card-based grid layout.

### Interview Summary

**Key Discussions**:

- **Scope**: Dashboard view only - other views (Transactions, Login, Register) remain unchanged
- **Layout approach**: Match demo EXACTLY - abandon current dashboard layout entirely
- **Grid system**: Responsive 1-col (mobile) → 2-col (tablet) → 3-col (desktop)
- **Card structure**: 5 fixed-height cards (h-64 / 256px each)
- **Header removal**: Remove header entirely from App.vue (no MainNav, no UserNav)
- **Background color**: Change global CSS variable from white to #e5e5e5
- **Component reusability**: Create DashboardCard component for future use in other views
- **Hover effects**: Skip for now - user has different plan
- **Quick Add**: Visual only (non-functional input placeholder)
- **Testing**: Manual browser verification only (no automated tests)

**Design Reference Analysis** (budget-demo-22.html):

- Brutalist aesthetic: No rounded corners, no shadows, black borders everywhere
- Typography: Helvetica for body, Courier New for monospace
- Heavy use of uppercase text with wide letter-spacing
- Fixed-height cards with uniform styling
- Hover effect in demo (skipped per user request)

**Data Mapping Decisions**:

1. **Balance card**: Net income for current month only (Jan 2026 income - Jan 2026 expenses)
2. **Savings card**: Savings rate percentage with progress bar, NO target text
3. **Analytics card**: Monthly expenses only (last 5 months: previous 4 + current), labeled "Spending Trend"
4. **Latest Activity card**: First 2-3 transactions from store, "VIEW ALL" button navigates to Transactions view (functional)
5. **Quick Add card**: Non-functional input with visual styling only

**Empty State Handling**:

- Balance: Show "$0.00" if no transactions
- Analytics: Show 5 empty/minimal bars if no data
- Latest Activity: Show "No recent transactions" message
- Savings: Show "0%" with empty progress bar

### Metis Review

**Identified Gaps** (addressed):

- ✅ Clarified Balance card shows current month net income only
- ✅ Clarified Analytics shows expenses only (not net income)
- ✅ Clarified "VIEW ALL" button is functional (routes to Transactions)
- ✅ Clarified Savings card has NO target text (removed from demo)
- ✅ Confirmed empty state handling for all cards
- ✅ Confirmed no period selector (fixed time periods only)
- ✅ Confirmed data flow preservation (stores/composables unchanged)

---

## Work Objectives

### Core Objective

Rewrite the Dashboard view to match the brutalist card-grid design from `ideas/budget-demo-22.html`, replacing the current multi-section layout with a responsive 5-card grid system while preserving all existing data logic and calculations.

### Concrete Deliverables

- Updated `src/App.vue` with header removed
- Updated `src/assets/main.css` with background color changed to #e5e5e5
- New component: `src/components/DashboardCard.vue`
- Rewritten `src/views/DashboardView.vue` with 5-card grid layout

### Definition of Done

- [x] Navigate to `http://localhost:5173` in browser → Dashboard displays 5 cards in grid
- [x] Verify responsive behavior: 1-col (mobile), 2-col (md), 3-col (lg)
- [x] Verify background color is #e5e5e5 on all pages
- [x] Verify no header visible on any page
- [x] Verify all 5 cards show correct data (or empty states if no data)
- [x] Verify "VIEW ALL" button navigates to Transactions view

### Must Have

- Exact grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- All cards fixed height: `h-64` (256px)
- Latest Activity card spans 2 columns: `md:col-span-2`
- Current month net income calculation for Balance card
- Last 5 months expense bars for Analytics card
- Functional "VIEW ALL" button routing to Transactions
- Empty state handling for all data-driven cards

### Must NOT Have (Guardrails)

- ❌ NO functionality for Quick Add card (visual only, no submit handler)
- ❌ NO period selector dropdown (fixed time periods only)
- ❌ NO changes to other views (Transactions, Login, Register)
- ❌ NO changes to stores or composables (except adding current month filter helper if needed)
- ❌ NO changes to existing UI components (Button, Input, Select, etc.)
- ❌ NO hover effect implementation (user will handle later)
- ❌ NO new npm dependencies or packages
- ❌ NO automated tests (manual verification only)
- ❌ NO accessibility features beyond existing code
- ❌ NO performance optimizations (caching, memoization, etc.)
- ❌ NO error toast notifications or complex error UI
- ❌ NO loading skeletons or shimmer effects

---

## Verification Strategy

> Manual browser verification only. No automated tests per user request.

### Test Decision

- **Infrastructure exists**: NO
- **User wants tests**: NO (Manual-only)
- **Framework**: None
- **QA approach**: Manual verification

### Manual QA Only

**CRITICAL**: Without automated tests, manual verification MUST be exhaustive.

Each TODO includes detailed verification procedures:

**By Deliverable Type:**

| Type            | Verification Tool        | Procedure                                        |
| --------------- | ------------------------ | ------------------------------------------------ |
| **Frontend/UI** | Browser (Chrome/Firefox) | Navigate, interact, verify visual output         |
| **Component**   | Vue DevTools             | Verify props, reactive data, computed values     |
| **Styling**     | Browser DevTools         | Inspect element, verify Tailwind classes applied |
| **Routing**     | Browser navigation       | Click links, verify URL changes, page renders    |

**Evidence Required:**

- Browser console output (no errors)
- Screenshots for visual changes
- Vue DevTools inspection for reactive data
- Manual interaction testing (clicks, navigation)

---

## Task Flow

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5
                              ↓
                         Task 6 (parallel with 5)
```

## Parallelization

| Group | Tasks | Reason                                                                    |
| ----- | ----- | ------------------------------------------------------------------------- |
| A     | 5, 6  | Card implementation can happen alongside testing if cards are independent |

| Task | Depends On | Reason                                               |
| ---- | ---------- | ---------------------------------------------------- |
| 2    | 1          | Need CSS variable updated before visual verification |
| 3    | 1, 2       | Need global styles set before header removal         |
| 4    | 1, 2, 3    | Need base setup complete before component creation   |
| 5    | 4          | Need DashboardCard component before using it in view |
| 6    | 5          | Need all cards implemented before final verification |

---

## TODOs

- [x] 1. Update global background color in CSS

  **What to do**:

  - Open `src/assets/main.css`
  - Locate the `:root` CSS variable section (around line 3-15)
  - Change `--bg-base: #ffffff;` to `--bg-base: #e5e5e5;`
  - Save file
  - Verify change persists (no formatter/linter reverts it)

  **Must NOT do**:

  - Do not change other CSS variables
  - Do not add new styles beyond the single variable change
  - Do not modify typography or other global styles

  **Parallelizable**: YES (independent task)

  **References**:

  **Existing CSS Variables** (file to modify):

  - `src/assets/main.css:3-15` - CSS :root section with --bg-base variable definition

  **Demo Reference** (target color):

  - `ideas/budget-demo-22.html:15` - Background color `#e5e5e5` applied to body

  **WHY**: This file contains the global CSS variable that controls background color across the entire app. Changing `--bg-base` from white to the gray tone (#e5e5e5) gives the brutalist aesthetic from the demo.

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  **For Frontend/UI changes:**

  - [ ] Using browser:
    - Command: `bun run dev` (start dev server)
    - Navigate to: `http://localhost:5173`
    - Action: Inspect body element background color
    - Verify: Background is #e5e5e5 (light gray, not white)
    - Screenshot: Save evidence to `.sisyphus/evidence/task-1-background-color.png` (optional)
  - [ ] Browser DevTools inspection:
    - Right-click body → Inspect
    - Verify computed style shows `background-color: rgb(229, 229, 229)` or `#e5e5e5`
    - Check all pages (Dashboard, Transactions, Login) have same background

  **Evidence Required:**

  - [ ] Browser console shows no errors related to CSS
  - [ ] Visual confirmation: background is light gray, not white
  - [ ] All views (Dashboard, Login, Register, Transactions) have gray background

  **Commit**: YES

  - Message: `style: update global background color to #e5e5e5`
  - Files: `src/assets/main.css`
  - Pre-commit: None (CSS change only)

---

- [x] 2. Remove header from App.vue

  **What to do**:

  - Open `src/App.vue`
  - Locate the `<header>` element (lines 12-18)
  - Remove the entire `<header v-if="authStore.isAuthenticated" ...>...</header>` block
  - Remove unused imports: `MainNav` and `UserNav` (lines 4-5)
  - Save file
  - Verify TypeScript/Vue LSP shows no errors

  **Must NOT do**:

  - Do not modify the `<main>` section
  - Do not change routing logic
  - Do not delete MainNav.vue or UserNav.vue component files (keep for future use)
  - Do not add any new navigation UI

  **Parallelizable**: NO (depends on 1)

  **References**:

  **File to Modify**:

  - `src/App.vue:12-18` - Header element to remove (contains MainNav and UserNav)
  - `src/App.vue:4-5` - Import statements to remove (MainNav, UserNav)

  **Component Structure Reference**:

  - `src/App.vue:10-24` - Full template structure showing header + main layout

  **Demo Reference**:

  - `ideas/budget-demo-22.html:41-160` - No header element, just card grid in body

  **WHY**: The demo has no navigation header - it's a full-screen card grid. Removing the header from App.vue eliminates the nav bar from all authenticated pages, matching the demo's layout.

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  **For Frontend/UI changes:**

  - [ ] Using browser:
    - Command: `bun run dev` (ensure server is running)
    - Navigate to: `http://localhost:5173` (login if needed)
    - Action: Scroll to top of page
    - Verify: No header with "Kash" branding, MainNav, or UserNav visible
    - Verify: Content starts immediately at top of viewport (no nav bar)
  - [ ] Browser DevTools inspection:
    - Right-click top of page → Inspect
    - Verify no `<header>` element in DOM
    - Verify main content has correct padding/spacing
  - [ ] Vue DevTools check:
    - Open Vue DevTools → Components tab
    - Verify MainNav and UserNav components not in component tree

  **Evidence Required:**

  - [ ] Browser console shows no errors
  - [ ] Visual confirmation: no header visible on any page
  - [ ] All routes accessible (can manually type URL to navigate)
  - [ ] No TypeScript/LSP errors in editor

  **Commit**: YES

  - Message: `refactor: remove header navigation from App.vue`
  - Files: `src/App.vue`
  - Pre-commit: `bun run lint:type-check` (verify no TS errors)

---

- [x] 3. Verify global changes don't break other views

  **What to do**:

  - Start dev server: `bun run dev`
  - Test each view manually in browser:
    1. Navigate to Login (`/login`)
    2. Navigate to Register (`/register`)
    3. Navigate to Dashboard (`/`)
    4. Navigate to Transactions (`/transactions`)
  - For each view, verify:
    - Background is #e5e5e5 (gray)
    - No header visible
    - Content renders without layout breaks
    - No console errors
  - Document any issues found

  **Must NOT do**:

  - Do not fix issues in other views (Dashboard only scope)
  - Do not add navigation UI yet
  - Do not modify routing

  **Parallelizable**: NO (depends on 1, 2)

  **References**:

  **Views to Test**:

  - `src/views/LoginView.vue` - Login form view
  - `src/views/RegisterView.vue` - Registration form view
  - `src/views/DashboardView.vue` - Main dashboard (will be rewritten next)
  - `src/views/TransactionsView.vue` - Transaction list view

  **Router Configuration**:

  - `src/router/index.ts` - Route definitions for all views

  **WHY**: Removing the header and changing background color are global changes. We need to verify they don't break layout, styling, or functionality in views that won't be redesigned (Login, Register, Transactions).

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  **For Frontend/UI changes:**

  - [ ] Using browser - Test all routes:
    - Command: `bun run dev`
    - Navigate to: `http://localhost:5173/login`
      - Verify: Gray background, no header, form visible and functional
    - Navigate to: `http://localhost:5173/register`
      - Verify: Gray background, no header, form visible and functional
    - Navigate to: `http://localhost:5173/` (Dashboard)
      - Verify: Gray background, no header, content visible (old layout for now)
    - Navigate to: `http://localhost:5173/transactions`
      - Verify: Gray background, no header, transaction list visible
  - [ ] Browser console check for EACH route:
    - Open DevTools → Console
    - Verify: No errors or warnings
    - Check: Vue DevTools shows components mounted correctly
  - [ ] Interaction testing:
    - Login page: Can type in inputs, see focus states
    - Register page: Can type in inputs, see focus states
    - Dashboard: Can see data (old layout)
    - Transactions: Can see transaction list, interact with table

  **Evidence Required:**

  - [ ] Screenshot of each view (4 total) showing gray background, no header
  - [ ] Console output for each route (no errors)
  - [ ] Manual confirmation: all views remain functional

  **Commit**: NO (verification only, no code changes)

---

- [x] 4. Create reusable DashboardCard component

  **What to do**:

  - Create new file: `src/components/DashboardCard.vue`
  - Implement card wrapper with:
    - Default slot for content
    - Fixed height: `h-64` class
    - Brutalist styling: white background, black border, padding
    - TypeScript `<script setup>` syntax
  - Match demo card styling exactly:
    - Classes: `bg-white border border-black h-64 flex flex-col justify-between p-8`
    - Transition classes: `transition-colors duration-300`
  - Export component (no need for index.ts update)

  **Must NOT do**:

  - Do not add hover effects (user will handle later)
  - Do not add props for now (keep simple, can extend later)
  - Do not add card-specific content (Balance, Savings, etc.) - just wrapper
  - Do not add animations beyond transition-colors

  **Parallelizable**: NO (depends on 1, 2, 3)

  **References**:

  **Demo Card Structure**:

  - `ideas/budget-demo-22.html:45-59` - Balance card structure (example card)
  - `ideas/budget-demo-22.html:46` - Card classes: `bg-white p-8 border border-black h-64 flex flex-col justify-between card-hover transition-colors duration-300`

  **Existing Component Patterns**:

  - `src/components/ui/Button.vue` - Example of Vue 3 component structure with TypeScript
  - `src/components/ui/Input.vue` - Example of component with slots and props

  **Demo Styling**:

  - `ideas/budget-demo-22.html:8-39` - Custom styles (note: skip hover styles per user request)

  **WHY**: DashboardCard is a reusable wrapper for all 5 cards. It provides consistent brutalist styling (white bg, black border, fixed height, flex layout) and will be reused in other views later. Keeping it simple (just a wrapper with default slot) makes it flexible.

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  **For Component creation:**

  - [ ] File created successfully:
    - Verify: `src/components/DashboardCard.vue` exists
    - Command: `ls -la src/components/DashboardCard.vue`
    - Expected: File size > 0 bytes
  - [ ] TypeScript/LSP validation:
    - Open file in editor
    - Verify: No TypeScript errors or warnings
    - Command (optional): `bun run lint:type-check`
    - Expected: No errors related to DashboardCard.vue
  - [ ] Component structure check:
    - Open file and verify:
      - Has `<script setup lang="ts">` block
      - Has `<template>` with default slot
      - Has Tailwind classes: `bg-white border border-black h-64 flex flex-col justify-between p-8`
      - NO hover classes (card-hover skipped)

  **Evidence Required:**

  - [ ] File exists and is valid Vue SFC
  - [ ] No TypeScript/LSP errors in editor
  - [ ] Component follows existing project patterns (script setup, TypeScript)

  **Commit**: YES

  - Message: `feat: add reusable DashboardCard component`
  - Files: `src/components/DashboardCard.vue`
  - Pre-commit: `bun run lint:type-check`

---

- [x] 5. Rewrite DashboardView.vue with 5-card grid layout

  **What to do**:

  - Open `src/views/DashboardView.vue`
  - **Remove** all existing template content (lines 93-250)
  - **Keep** existing script setup with:
    - All imports (stores, composables, formatters)
    - All reactive refs and computed properties
    - `loadData()` function and `onMounted` hook
  - **Add** new computed properties:
    - `currentMonthTransactions`: Filter `latestTransactions` for current month only
    - `currentMonthSummary`: Run `useFinancialCalculations` on current month data
    - `last5MonthsExpenses`: Slice last 5 months from `monthlyAnalysis`, extract expenses
  - **Implement** new template with grid layout:
    ```vue
    <div class="min-h-screen p-8 flex items-center justify-center">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl w-full">
        <!-- Card 1: Balance -->
        <!-- Card 2: Quick Add -->
        <!-- Card 3: Savings -->
        <!-- Card 4: Latest Activity (md:col-span-2) -->
        <!-- Card 5: Analytics -->
      </div>
    </div>
    ```
  - **Implement each card** using `<DashboardCard>`:
    1. **Balance card**: Show `currentMonthSummary.netIncome` with large text, USD label, "Balance" tag
    2. **Quick Add card**: Input with placeholder "124.50 groceries", arrow button (→), format hint, NO submit handler
    3. **Savings card**: Progress bar showing `financialSummary.savingsRate`, percentage label, NO target text
    4. **Latest Activity card**: Loop first 2 items from `latestTransactions`, show name/category/amount, "VIEW ALL" button with `@click="$router.push('/transactions')"`
    5. **Analytics card**: 5 bars from `last5MonthsExpenses`, scale heights to max value, "Spending Trend" label
  - **Handle empty states**:
    - Balance: "$0.00" if no data
    - Latest Activity: "No recent transactions" if empty
    - Analytics: Show 5 minimal bars (h-[10%]) if no data
    - Savings: 0% if no data

  **Must NOT do**:

  - Do not add period selector (no dropdown)
  - Do not implement Quick Add submit functionality
  - Do not add hover effects
  - Do not change existing computed properties (trendSeries, netFlowSeries, etc.) unless they're removed
  - Do not modify stores or composables
  - Do not add new dependencies

  **Parallelizable**: NO (depends on 4)

  **References**:

  **Current DashboardView Structure** (to replace):

  - `src/views/DashboardView.vue:1-251` - Full current implementation (script + template)
  - `src/views/DashboardView.vue:1-91` - Script setup with imports, composables, computed properties (KEEP THESE)
  - `src/views/DashboardView.vue:93-250` - Template with old layout (REMOVE THIS)

  **Data Sources to Use**:

  - `src/composables/useFinancialCalculations.ts:32-57` - `financialSummary` computed property (netIncome, savingsRate, etc.)
  - `src/composables/useFinancialCalculations.ts:92-123` - `monthlyAnalysis` computed property (monthly breakdown)
  - `src/composables/useChartData.ts:49-72` - `categorySpending` computed (not needed for new design)
  - `src/stores/records.ts:41-43` - `latestTransactions` computed property

  **Demo Card Implementations** (match these):

  - `ideas/budget-demo-22.html:45-59` - Balance card HTML structure
  - `ideas/budget-demo-22.html:61-85` - Quick Add card with input
  - `ideas/budget-demo-22.html:87-103` - Savings card with progress bar
  - `ideas/budget-demo-22.html:105-135` - Latest Activity card (2-col span)
  - `ideas/budget-demo-22.html:137-158` - Analytics card with bar chart

  **Typography/Styling Patterns**:

  - Demo uses `font-mono text-xs uppercase tracking-widest` for labels
  - Demo uses `text-5xl font-bold tracking-tighter` for large numbers
  - Demo uses `border border-black px-2 py-1` for tag badges

  **Routing for VIEW ALL**:

  - `src/router/index.ts` - Router instance for navigation (use `$router.push('/transactions')`)

  **WHY Each Reference Matters**:

  - Current DashboardView shows what data is already computed - we're keeping the script logic, just replacing the template
  - useFinancialCalculations gives us netIncome and savingsRate - exactly what Balance and Savings cards need
  - monthlyAnalysis gives us monthly breakdown - slice last 5 for Analytics card
  - latestTransactions gives us recent activity - slice first 2-3 for Latest Activity card
  - Demo HTML shows exact structure/classes to match for each card type

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  **For Frontend/UI changes:**

  - [ ] Using browser:
    - Command: `bun run dev`
    - Navigate to: `http://localhost:5173/` (Dashboard)
    - Action: View page layout
    - Verify: 5 cards visible in grid (Balance, Quick Add, Savings, Latest Activity, Analytics)
    - Verify: Latest Activity spans 2 columns on desktop (lg breakpoint)
    - Verify: All cards have h-64 fixed height
  - [ ] Responsive testing:
    - Resize browser to mobile width (<768px)
    - Verify: Cards stack vertically (1 column)
    - Resize to tablet width (768px - 1024px)
    - Verify: 2-column grid, Latest Activity spans both columns
    - Resize to desktop width (>1024px)
    - Verify: 3-column grid, Latest Activity spans 2 columns
  - [ ] Data verification for each card:

    **Balance Card**:

    - Open DevTools Console
    - Check computed value of `currentMonthSummary.netIncome`
    - Verify: Number displayed matches computation
    - Verify: Shows "$0.00" if no current month transactions

    **Savings Card**:

    - Check computed value of `financialSummary.savingsRate`
    - Verify: Percentage displayed matches computation
    - Verify: Progress bar width matches percentage
    - Verify: NO "Target" text visible

    **Latest Activity Card**:

    - Check `latestTransactions` array length
    - Verify: Shows 2-3 transactions (or fewer if less data)
    - Verify: Each transaction shows name, category, amount
    - Verify: "VIEW ALL" button visible
    - Action: Click "VIEW ALL" button
    - Verify: Navigates to `/transactions` route

    **Analytics Card**:

    - Check `monthlyAnalysis` array
    - Verify: Shows 5 bars (or fewer if less than 5 months of data)
    - Verify: Bar heights scale relative to max expense
    - Verify: Label says "Spending Trend"
    - Verify: Shows minimal bars if no data

    **Quick Add Card**:

    - Verify: Input placeholder text "124.50 groceries"
    - Verify: Arrow button (→) visible
    - Verify: Format hint "Format: amount category"
    - Action: Try typing in input
    - Verify: Can type, but no submit functionality

  - [ ] Empty state testing:
    - If you have no transactions, verify:
      - Balance shows "$0.00"
      - Latest Activity shows "No recent transactions"
      - Analytics shows 5 empty/minimal bars
      - Savings shows "0%"

  **Evidence Required:**

  - [ ] Screenshot of desktop view (3-col grid) showing all 5 cards
  - [ ] Screenshot of mobile view (1-col stack)
  - [ ] Screenshot of tablet view (2-col grid)
  - [ ] Browser console shows no errors
  - [ ] Vue DevTools shows all computed properties have correct values
  - [ ] "VIEW ALL" button successfully navigates to Transactions

  **Commit**: YES

  - Message: `refactor: rewrite DashboardView with brutalist card grid`
  - Files: `src/views/DashboardView.vue`
  - Pre-commit: `bun run lint:type-check`

---

- [x] 6. Final end-to-end verification

  **What to do**:

  - Clear browser cache and restart dev server
  - Test complete user flow:
    1. Navigate to login page → verify gray background, no header
    2. Login with credentials
    3. Verify Dashboard loads with 5 cards in grid
    4. Test responsive behavior (mobile, tablet, desktop breakpoints)
    5. Click "VIEW ALL" → verify navigation to Transactions
    6. Navigate back to Dashboard → verify state persists
    7. Check all other routes (Register, Transactions) still work
  - Open Vue DevTools:
    - Verify no memory leaks (component count stable)
    - Verify reactive data updates correctly
  - Performance check:
    - Open DevTools → Performance tab
    - Record page load
    - Verify no major bottlenecks (should load <2s)
  - Browser compatibility:
    - Test in Chrome
    - Test in Firefox (optional but recommended)
  - Document any issues or deviations from demo

  **Must NOT do**:

  - Do not fix issues outside Dashboard scope
  - Do not add features not in plan
  - Do not refactor code for performance (unless critical issue)

  **Parallelizable**: YES (can run alongside Task 5 if cards are implemented independently)

  **References**:

  **Demo for Visual Comparison**:

  - `ideas/budget-demo-22.html` - Open in browser side-by-side for visual comparison

  **All Modified Files** (verify changes):

  - `src/App.vue` - Header removed
  - `src/assets/main.css` - Background color changed
  - `src/components/DashboardCard.vue` - New component
  - `src/views/DashboardView.vue` - Rewritten view

  **Routes to Test**:

  - `/login` - Login page
  - `/register` - Register page
  - `/` - Dashboard (main focus)
  - `/transactions` - Transactions list

  **WHY**: This is the final verification to ensure all pieces work together correctly, the design matches the demo, responsive behavior works across breakpoints, and no regressions were introduced in other views.

  **Acceptance Criteria**:

  **Manual Execution Verification**:

  **For Frontend/UI changes:**

  - [ ] Full user flow test:
    - Command: `bun run dev` (restart server with cache cleared)
    - Navigate to: `http://localhost:5173/login`
    - Action: Login with test credentials
    - Verify: Redirects to Dashboard
    - Verify: 5 cards visible, correct data displayed
  - [ ] Visual comparison with demo:
    - Open `ideas/budget-demo-22.html` in browser
    - Open `http://localhost:5173/` in another tab
    - Compare side-by-side:
      - Grid layout matches (3-col on desktop)
      - Card styling matches (white bg, black borders, h-64)
      - Typography matches (Helvetica, Courier New for mono)
      - Spacing matches (gap-4, p-8 padding)
  - [ ] Responsive breakpoint testing:
    - Mobile (<768px): 1-col stack, all cards full width
    - Tablet (768-1024px): 2-col grid, Latest Activity spans both
    - Desktop (>1024px): 3-col grid, Latest Activity spans 2
    - Screenshot each breakpoint for evidence
  - [ ] Cross-route navigation:
    - From Dashboard → Click "VIEW ALL" → Verify Transactions loads
    - From Transactions → Type `/` in URL → Verify Dashboard loads
    - From Dashboard → Type `/login` in URL → Verify Login loads
    - All routes: Verify gray background, no header, no layout breaks
  - [ ] Vue DevTools inspection:
    - Open Vue DevTools → Components tab
    - Select DashboardView component
    - Verify computed properties:
      - `currentMonthTransactions` has correct length
      - `currentMonthSummary` has correct netIncome
      - `last5MonthsExpenses` has 5 entries (or fewer if less data)
      - `latestTransactions` array populated
    - Check for memory leaks: Refresh page, check component count stable
  - [ ] Browser console check:
    - Open DevTools → Console
    - Verify: NO errors or warnings
    - Verify: No failed network requests
    - Verify: No Vue warnings
  - [ ] Performance check (optional but recommended):
    - DevTools → Performance tab → Record page load
    - Verify: Page loads in <2 seconds
    - Verify: No long tasks (>50ms blocking main thread)

  **Evidence Required:**

  - [ ] Screenshots of all 3 breakpoints (mobile, tablet, desktop)
  - [ ] Screenshot of side-by-side comparison with demo
  - [ ] Console output showing no errors
  - [ ] Vue DevTools screenshot showing computed properties
  - [ ] Manual confirmation: All acceptance criteria met

  **Commit**: NO (verification only, no code changes)

---

## Commit Strategy

| After Task | Message                                                    | Files                              | Verification              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- | ------------------------- |
| 1          | `style: update global background color to #e5e5e5`         | `src/assets/main.css`              | Visual check in browser   |
| 2          | `refactor: remove header navigation from App.vue`          | `src/App.vue`                      | `bun run lint:type-check` |
| 4          | `feat: add reusable DashboardCard component`               | `src/components/DashboardCard.vue` | `bun run lint:type-check` |
| 5          | `refactor: rewrite DashboardView with brutalist card grid` | `src/views/DashboardView.vue`      | `bun run lint:type-check` |

---

## Success Criteria

### Verification Commands

```bash
# Start dev server
bun run dev

# Type check (run after each commit)
bun run lint:type-check

# Navigate in browser
open http://localhost:5173
```

### Final Checklist

- [x] All "Must Have" features present:
  - Grid layout: 1-col (mobile), 2-col (md), 3-col (lg)
  - All 5 cards with h-64 height
  - Latest Activity spans 2 columns on md+
  - Balance shows current month net income
  - Analytics shows last 5 months expenses
  - "VIEW ALL" routes to Transactions
  - Empty states handled
- [x] All "Must NOT Have" items absent:
  - Quick Add has NO submit functionality
  - NO period selector
  - NO changes to other views
  - NO hover effects
  - NO new dependencies
  - NO tests added
- [x] Visual match with demo:
  - Background #e5e5e5
  - No header
  - White cards with black borders
  - Typography matches (Helvetica, Courier New)
  - Fixed card heights
- [x] All routes functional:
  - Login, Register, Dashboard, Transactions all load
  - Navigation works (manual URL, "VIEW ALL" button)
  - No console errors
- [x] Data displays correctly:
  - Balance shows correct current month net income
  - Savings shows correct percentage
  - Latest Activity shows recent transactions
  - Analytics shows 5 monthly bars
  - Empty states show when no data
