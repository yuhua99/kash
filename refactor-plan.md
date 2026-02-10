# Refactor Plan

## Target Architecture

- **core**: environment, HTTP client, domain model types.
- **features**: `auth`, `categories`, `records` each owns API logic and feature-specific helpers.
- **shared**: cross-feature date and validation utilities.
- **routes**: UI and page-level orchestration only.

## Applied In This Refactor

1. Added core infrastructure:
   - `src/lib/core/config/env.ts`
   - `src/lib/core/http/api-client.ts`
   - `src/lib/core/domain/models.ts`
2. Added feature modules:
   - `src/lib/features/auth/{api.ts,form-submit.ts}`
   - `src/lib/features/categories/{api.ts,cache.ts}`
   - `src/lib/features/records/api.ts`
3. Added shared modules:
   - `src/lib/shared/date.ts`
   - `src/lib/shared/validation.ts`
   - `src/lib/shared/types.ts`
4. Migrated routes and components to the new modules.
5. Kept backward-compatible adapter files under `src/lib/*.ts` to avoid breaking external imports while moving forward with the new structure.
6. Removed dead components:
   - `src/lib/components/RowActionsMenu.svelte`
   - `src/lib/components/CollapsibleExample.svelte`

## Remaining Optional Cleanup

- Split large route files (`records`, `categories`) into smaller feature UI components.
- Move from client `onMount` loading to server-first `+page.server.ts` / actions.
- Slice `src/app.css` into shared tokens plus per-feature style modules.
