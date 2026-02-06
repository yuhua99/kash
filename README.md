# Kash Budget Frontend

## Run

```sh
bun install
bun run dev
```

## Environment

- Set `VITE_API_BASE_URL` in `.env`.
- Default API URL is `http://localhost:3000`.
- All requests include `credentials: "include"` for cookie-session auth.

## Route map

- `/login`: login form
- `/register`: account creation form
- `/home`: full-screen quick-add record form
- `/records`: record list, search/filter/sort, create/edit/delete
- `/categories`: category list and create/edit/delete
- `/stats`: net and category breakdown by selected time preset
- `/settings`: session actions (logout)

## Checklist

- Spec routes and flows implemented
- Auth gating implemented for protected/public-auth routes
- API integration aligned with `API.md` endpoints
- Validation limits and rules matched to `API.md`
- Loading/empty/inline error states implemented per page
- Style tokens and constraints from `STYLE.md` applied
