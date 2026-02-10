# Refactor Plan

## Target Architecture

- **core**: environment, HTTP client, domain model types.
- **features**: `auth`, `categories`, `records`, `periods`, `stats` own API logic and feature-specific helpers/components.
- **ui**: shared UI primitives and styles in `src/lib/ui`.
- **routes**: UI and page-level orchestration only, with client-side data loading.

## Applied In This Refactor

1. Added core infrastructure:
   - `src/lib/core/config/env.ts`
   - `src/lib/core/http/api-client.ts`
   - `src/lib/core/domain/models.ts`
2. Added feature modules and APIs:
   - `src/lib/features/auth/{api.ts,form-submit.ts}`
   - `src/lib/features/categories/{api.ts,cache.ts}`
   - `src/lib/features/records/api.ts`
3. Added UI primitives and co-located styles under `src/lib/ui/*`.
4. Migrated routes to client `+page.ts` loaders and split UI into feature components under `src/lib/features/*/components`.
5. Trimmed `src/app.css` down to tokens, reset, layout, and base form styles.
6. Removed legacy re-export files under `src/lib/*.ts` and deleted dead components:
   - `src/lib/components/RowActionsMenu.svelte`
   - `src/lib/components/CollapsibleExample.svelte`

## Remaining Optional Cleanup

- Decide whether to re-enable SSR and move data loading to `+page.server.ts`.
- Add additional UI primitives if new patterns repeat (e.g., input/field wrappers).
- Run `bun run check` to confirm types after refactors.
