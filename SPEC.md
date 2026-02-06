# SPEC.md

## Purpose and scope
- Build a single-user personal budget web app.
- Core areas: auth, home, records, categories, stats, settings.
- Out of scope: multi-user sharing, billing, import/export, offline sync.

## Target user and device priorities
- Single-user session model with cookie-based auth.
- Mobile-first UX is the default.
- Desktop refines layout and density without changing the primary mobile flow.

## Design system and UI implementation rules
- Use Bits UI components whenever possible.
- Do not rebuild primitive UI components when an equivalent Bits UI component exists.
- Follow `STYLE.md` strictly:
- Keep layouts mobile-focused first; desktop extends the same structure.

## Existing infrastructure library (already implemented)
- Reuse `src/lib/` and do not re-implement equivalent infrastructure helpers.
- Import from `$lib`/`$lib/index` rather than creating duplicate API, date, type, or validation modules.
- Available modules in `src/lib/`:
  - `api.ts`: cookie-auth API client (`credentials: "include"`) and auth/records/categories request helpers.
  - `date.ts`: period presets and ISO date range utilities.
  - `types.ts`: shared API/domain TypeScript types.
  - `validation.ts`: form validation helpers aligned with backend constraints.
  - `index.ts`: re-export barrel for all infrastructure utilities.

## Route map and responsibilities
- `/login`: login form and session start.
- `/register`: account creation.
- `/home`: full-screen add record form only.
- `/records`: record list, search, filters, sorting, date period controls, create/edit/delete.
- `/categories`: category list with create/edit/delete.
- `/stats`: net totals and category breakdown and other sensible analytics for selected period.
- `/settings`: session/account actions (logout).

## Auth and route protection
- Protected routes: `/home`, `/records`, `/categories`, `/stats`, `/settings`.
- Unauthenticated users are redirected to `/login`.
- Authenticated users visiting `/login` or `/register` are redirected to `/home`.
- Session is determined from backend auth state (`/auth/me`) using cookie auth.

## Core user flows
- Register -> login -> persisted session -> logout.
- Home quick-add: enter fields -> submit -> success feedback -> form reset.
- Records: view list -> search/filter/sort/date range -> create/edit/delete -> list refreshes.
- Categories: view list -> create/edit/delete -> list refreshes.
- Stats: choose period -> view net and category breakdown.

## Records behavior
- Search by record name.
- Filter by category.
- Filter by income/expense.
- Sort by date, category, or amount.
- Support period-based filtering using start/end date controls.
- Keep behavior consistent with API constraints and server ordering defaults.

## Stats behavior
- Show sensible analytics for selected date period.
- Required outputs:
  - Net total (income + expenses).
  - Category-level breakdown.
- Use the same period options and controls as `/records`.

## Data fetching and state handling
- All API requests include `credentials: "include"`.
- Use `$lib/api` helpers as the default integration path for backend requests.
- Fetch page data on route entry.
- After create/update/delete, refetch authoritative data from server.
- Optimistic updates are optional; default behavior is non-optimistic + refetch.
- Surface API errors inline at the point of interaction.

## Forms and validation
- Validate on submit; display inline field-level errors.
- Use `$lib/validation` helpers; avoid duplicating rule logic in route components.
- Validation rules must match `API.md` exactly:
  - username: 4-50, alphanumeric plus `_` and `-`
  - password: minimum 6
  - category name: 1-100
  - record name: 1-255
  - search term: empty allowed; when provided, max 100
- Date format: `YYYY-MM-DD`.
- Amount rules: positive = income, negative = expense, amount cannot be 0.

## Shared types and date utilities
- Use shared types from `$lib/types` for API payload/response handling.
- Use `$lib/date` period helpers to keep `/records` and `/stats` period behavior consistent.

## Loading, empty, and error states
- Each route with data fetching shows a clear loading state.
- Show explicit empty states when no records, categories, or stats are available.
- Show inline, human-readable errors for request failures and validation issues.
- Handle auth failures (401) by redirecting or prompting re-login per route context.

## Acceptance criteria
- All listed routes exist and meet responsibilities.
- Auth gating works for protected routes and public auth routes.
- API integration follows `API.md` and includes credentials.
- Validation behavior matches backend limits.
- Bits UI is used for primitives where available.
- UI behavior and visual style match `STYLE.md`.
- Mobile-first layout is the baseline across all routes.
