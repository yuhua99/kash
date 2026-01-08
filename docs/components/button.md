# Button

## Usage

```vue
<script setup>
import { Button } from '@/components/ui'
</script>

<template>
  <Button text="Click me" />
  <Button text="Disabled" disabled />
</template>
```

## Props

| Prop       | Type      | Default | Description         |
| ---------- | --------- | ------- | ------------------- |
| `text`     | `string`  | -       | Button text content |
| `disabled` | `boolean` | `false` | Disables the button |

## Styling

The Button component includes default styling that should not be overridden by callers:

- **Default state**: White background, black text, black border
- **Hover state**: Black background, white text (inverted)
- **Disabled state**: Light gray background (`bg-gray-200`), black text, no hover effect
- **Typography**: `text-xs uppercase tracking-widest` (monospace via `.ui-base`)
- **Dimensions**: vertical padding `py-2`, horizontal padding `px-4`

### CSS Classes Applied

```
bg-white text-black h-10 px-4 py-2 text-xs uppercase tracking-widest
transition-colors hover:bg-black hover:text-white
disabled:cursor-not-allowed disabled:bg-gray-200
disabled:hover:bg-gray-200 disabled:hover:text-black
```

**Note:** Border (`border-black`), monospace font, and base text color are applied automatically via global CSS to all `<button>` elements.

### Caller-Provided Classes

Callers should only add **layout-specific** classes:

```vue
<!-- Width control -->
<Button text="Submit" class="w-full" />

<!-- Alignment/spacing -->
<Button text="Cancel" class="ml-auto" />

<!-- Text alignment (rare) -->
<Button text="Menu item" class="text-left" />
```

**Do not override:** Font size, padding, colors, borders, or typography transform.

## Events

None
