# Kash Budget Infra

## Run

```sh
bun install
bun run check
```

## Environment

- Set `VITE_API_BASE_URL` in `.env`.
- Default API URL is `http://localhost:3000`.
- All requests include `credentials: "include"` for cookie-session auth.

## Infra Surface

- Core infrastructure: `src/lib/core/config/env.ts`, `src/lib/core/http/api-client.ts`, `src/lib/core/domain/models.ts`
- Feature APIs and helpers: `src/lib/features/*`
- Feature UI components: `src/lib/features/*/components`
- UI primitives and styles: `src/lib/ui/*`
- Routes: `src/routes` for page orchestration and data loading

## Notes

- UI routes and styling were removed intentionally.
- Keep `API.md` as the source of truth for endpoint contracts and limits.
