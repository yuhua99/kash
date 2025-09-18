# Skeleton Loading Cheatsheet

Keep skeletons stupid-simple and close to the real UI. If a skeleton drifts from the layout it mirrors, delete it and start again.

## Core Pieces
- `src/components/ui/skeleton/Skeleton.vue` — base block. Accepts `variant` (`text`, `title`, `chip`, `input`, `circle`, `block`) and `size` (`sm`, `md`, `lg`). Defaults to a neutral rounded rectangle.
- `SkeletonText.vue` and `SkeletonCircle.vue` — thin wrappers that pre-set sensible variants for copy and circular affordances.
- `src/lib/skeletonTheme.ts` — shared token map for width/height/radius so the whole app stays consistent.

### Picking the right component
- Use `Skeleton.vue` when you need full control: any bespoke width/height, grid cell, button stand-in, or weird layout. Set `variant`/`size` explicitly.
- Use `SkeletonText.vue` for inline or block text placeholders. It ships with `variant="text"` and scales widths the same way our typography tokens do, so you only tweak Tailwind classes when the line length changes.
- Use `SkeletonCircle.vue` for avatars, donut charts, icon wells—anything that must stay perfectly round. It locks the `circle` variant and handles the radius so you do not juggle both `rounded-full` and manual sizing.

## Dos and Don'ts
- Do render skeletons **inside** the actual component tree; pass a `loading` prop down instead of dumping separate markup in views.
- Do mark the real container with `aria-busy` while loading; the skeleton itself is already `aria-hidden`.
- Do keep spacing identical to the loaded state. Skeleton blocks should sit in the same slots as the final content.
- Don't invent brand-new layouts for loading; copy the shape of the finished UI.
- Don't leave animation running for users who opt out. The skeleton class already respects `prefers-reduced-motion`; keep it that way.

## Quick Pattern
1. Expose `loading?: boolean` on the component that owns the data.
2. Swap each sub-piece with a skeleton variant when `loading` is true. Reuse the same flex/grid wrappers so nothing jumps.
3. Hide interactive affordances (dialogs, buttons) while loading if they depend on data; otherwise disable them explicitly.

## When To Extend
- If a component needs a shape we do not cover, add the size token first (`SkeletonSize`) and keep it generic.
- Add wrapper components only when the same skeleton layout repeats in three or more places.
- Document any new pattern here so the next engineer does not guess.

Ship the smallest, truest skeleton that keeps layout stable—anything flashier is noise.
