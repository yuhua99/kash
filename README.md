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

- API client: `src/lib/api.ts`
- API types: `src/lib/types.ts`
- Validation helpers: `src/lib/validation.ts`
- Date and formatting helpers: `src/lib/date.ts`
- Barrel exports: `src/lib/index.ts`

## Notes

- UI routes and styling were removed intentionally.
- Keep `API.md` as the source of truth for endpoint contracts and limits.
