# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start development server on localhost:5173
npm run build        # Type-check and build for production
npm run preview      # Preview production build
```

### Linting & Type Checking
```bash
npm run lint         # Run all linting (oxlint + eslint + type check)
npm run format       # Format code with Prettier
```

### Individual Linting Commands
```bash
npm run lint:oxlint  # Run oxlint with auto-fix
npm run lint:eslint  # Run eslint with auto-fix
npm run lint:type-check   # Run type check with vue-tsc
```

## Architecture

### Tech Stack
- **Frontend**: Vue 3 with TypeScript, Composition API
- **Build Tool**: Vite with Vue DevTools
- **Styling**: Tailwind CSS v4 with shadcn/ui components (reka-ui)
- **State Management**: Pinia stores
- **Routing**: Vue Router with auth guards
- **API**: Session-based authentication with custom fetch client
- **Charts**: Unovis for data visualization

### Project Structure
- `src/components/ui/` - shadcn/ui component library (auto-generated, excluded from linting)
- `src/components/` - Feature-specific components organized by domain (auth, categories, transactions, dashboard, layout)
- `src/stores/` - Pinia stores for state management (auth, categories, records)
- `src/composables/` - Vue composables for reusable logic (API requests, form validation, financial calculations)
- `src/views/` - Route-level components
- `src/lib/` - Utilities and API client
- `src/types/` - TypeScript type definitions organized by domain

### Key Architecture Patterns
- **API Communication**: Custom fetch-based client in `src/lib/api.ts` with session cookies
- **Authentication**: Store-based auth with router guards, session persistence via `/auth/me` endpoint
- **State Management**: Domain-specific Pinia stores with composable integration
- **Form Handling**: Reusable form validation composables with reactive error handling
- **UI Components**: shadcn/ui components with consistent styling patterns

### Backend Integration
- API proxy configured in Vite to forward `/api/*` to `https://budget-api.60009000.xyz`
- Session-based authentication with HTTP-only cookies
- Per-user database isolation
- See `API_DOCUMENT.md` for complete API reference

### Component Organization
UI components follow shadcn/ui patterns with index.ts exports. Feature components are organized by domain (auth, categories, transactions, dashboard) and use composables for business logic.

## Coding Guidelines

### Vue Component Patterns
- Always use `<script setup lang="ts">` with Composition API
- Import types explicitly: `import type { User } from '@/types'`
- Define interfaces before component logic:
  ```typescript
  interface Props {
    user?: User | null
    mode?: 'edit' | 'view'
  }
  ```
- Use `withDefaults()` for prop defaults
- Structure: imports → interfaces → props/emits → composables → refs/computed → functions → watchers

### TypeScript Standards
- Strict typing required for all API interactions
- Organize types by domain in `src/types/` (auth.ts, category.ts, transaction.ts, api.ts)
- Re-export all types from `src/types/index.ts`
- Use generic types for API responses: `ApiResponse<T>`
- Define payload interfaces for all API operations

### Pinia Store Patterns
- Use Composition API pattern: `defineStore('name', () => {})`
- Integrate `useApiRequest` composable for all API calls:
  ```typescript
  const { isLoading, error, executeRequest } = useApiRequest()
  ```
- Store structure: reactive state → computed getters → async actions
- Include `clearError` in returned store interface

### API Integration Rules
- Use singleton `api` client from `src/lib/api.ts`
- Wrap API calls in `executeRequest()` for consistent error handling
- Session authentication with `credentials: 'include'`
- Handle loading states and errors through store integration

### UI Component Standards
- **NEVER** modify files in `src/components/ui/` - these are auto-generated
- Import UI components from index files: `@/components/ui/button`
- Use `cn()` utility for class merging: `cn('base-classes', props.class)`
- Follow Tailwind v4 patterns with CSS variables

### Form Handling
- Use `useFormValidation` composable for validation logic
- Implement proper v-model binding with watchers for external updates
- Display loading states: `:disabled="store.isLoading"`
- Show errors: `v-if="store.error"` with consistent red styling

### Import Organization
1. Vue core imports (`vue`, `vue-router`)
2. Vue ecosystem (`pinia`)
3. UI components (`@/components/ui/*`)
4. Local components (`@/components/*`)
5. Types (`type` imports)
6. Composables and stores
7. Use `@/` alias consistently

### Authentication Flow
- Check auth status on app initialization before router setup
- Use router guards with `meta: { requiresAuth: true }`
- Handle session persistence via `/auth/me` endpoint
- Clear local state on logout regardless of server response

### Error Handling
- Display server errors as text strings with red-themed styling
- Catch network errors in API client
- Clear errors when starting new operations
- Use `console.warn()` for non-critical errors

### Development Workflow
- Run `npm run lint` before commits (includes oxlint + eslint + type checking)
- Use `npm run format` for Prettier formatting  
- ESLint ignores `src/components/ui/**` auto-generated components
- Single-word component names allowed for UI components only
