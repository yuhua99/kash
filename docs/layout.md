Desktop layout notes (no code)

Default page after login

- Default route is Transactions. The experience is ledger-first and action-focused.
- No sidebar. Top bar only.
- Username is visible in the top-right user menu.

Transactions page (desktop)

- Primary view is the ledger list with search and filters on top.
- Add transaction is the main action and stays prominent near the search/filters row.
- Manage categories is not a primary action.
  - Primary entry lives in the user menu.
  - Secondary shortcut lives in the page title overflow menu.
- Category management opens as a right-side drawer on desktop.

Analytics / Dashboard page (desktop)

- Separate Analytics route for stats (no CRUD and no transaction list).
- Period controls live here.
- Chart-first layout with multiple panels (not a single full-width chart).
- Quick facts row at the bottom (Net, Income, Expenses, Largest transaction).

Category management placement

- Removed from main navigation routes.
- Accessed from:
  - User menu (primary)
  - Page overflow menu (secondary)
  - Optional: link inside Add/Edit transaction dialog

## Style

See `docs/style.md` for the complete style guide including:

- Design system rules (Modern Structural / Minimalistic)
- Typography hierarchy (4-level system)
- Color palette (monochrome black/white)
- Component styling guidelines
