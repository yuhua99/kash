# DropdownMenu

## Usage

```vue
<script setup>
import { DropdownMenu } from '@/components/ui'
import { Button } from '@/components/ui'

const menuItems = [
  { id: '1', label: 'Edit', value: 'edit' },
  { id: '2', label: 'Delete', value: 'delete' },
  { id: '3', label: 'Archive', value: 'archive', disabled: true },
]

function handleSelect(item) {
  console.log('Selected:', item)
}
</script>

<template>
  <DropdownMenu :items="menuItems" align="right" @select="handleSelect">
    <template #trigger>
      <Button text="Actions" />
    </template>
  </DropdownMenu>
</template>
```

## Props

| Prop                  | Type                            | Default | Description                                        |
| --------------------- | ------------------------------- | ------- | -------------------------------------------------- |
| `items`               | `DropdownMenuItem[]`            | -       | Array of menu items to display                     |
| `align`               | `'left' \| 'center' \| 'right'` | `left`  | Alignment of the dropdown menu relative to trigger |
| `openOn`              | `'click' \| 'hover'`            | `click` | Trigger behavior for opening the menu              |
| `closeOnSelect`       | `boolean`                       | `true`  | Close menu after selecting an item                 |
| `closeOnOutsideClick` | `boolean`                       | `true`  | Close menu when clicking outside                   |
| `disabled`            | `boolean`                       | `false` | Disables the dropdown menu                         |

### DropdownMenuItem Interface

```ts
interface DropdownMenuItem {
  id: string // Unique identifier
  label: string // Display text
  value?: any // Optional value payload
  disabled?: boolean // Disables the menu item
}
```

## Slots

### `trigger` (required)

The trigger element that opens the dropdown menu. Receives scoped slot props:

```vue
<template #trigger="{ toggle, isOpen, open, close }">
  <Button text="Actions" />
</template>
```

**Slot props:**

- `toggle: () => void` - Toggles menu open/closed
- `isOpen: boolean` - Current open state
- `open: () => void` - Opens the menu
- `close: () => void` - Closes the menu

### `item` (optional)

Custom rendering for menu items. Receives scoped slot props:

```vue
<template #item="{ item, index, select }">
  <button @click="select">
    <Icon :name="item.icon" />
    {{ item.label }}
  </button>
</template>
```

**Slot props:**

- `item: DropdownMenuItem` - The menu item data
- `index: number` - Item index in the array
- `select: () => void` - Function to select this item

## Events

| Event    | Payload            | Description                          |
| -------- | ------------------ | ------------------------------------ |
| `select` | `DropdownMenuItem` | Emitted when a menu item is selected |
| `open`   | -                  | Emitted when the dropdown opens      |
| `close`  | -                  | Emitted when the dropdown closes     |

## Keyboard Navigation

The DropdownMenu component supports full keyboard accessibility:

- **ArrowDown** - Move focus to next item (wraps to first)
- **ArrowUp** - Move focus to previous item (wraps to last)
- **Home** - Jump to first item
- **End** - Jump to last item
- **Enter / Space** - Select the focused item
- **Escape** - Close menu and return focus to trigger
- **Tab** - Close menu and allow natural tab flow

## Exposed Methods

The component exposes methods via template ref:

```vue
<script setup>
import { ref } from 'vue'

const dropdownRef = ref()

function programmaticallyOpen() {
  dropdownRef.value.open()
}
</script>

<template>
  <DropdownMenu ref="dropdownRef" :items="items">
    <template #trigger>
      <Button text="Actions" />
    </template>
  </DropdownMenu>
</template>
```

**Available methods:**

- `open()` - Opens the dropdown
- `close()` - Closes the dropdown
- `toggle()` - Toggles open/closed state

**Exposed properties:**

- `isOpen: Ref<boolean>` - Current open state

## Styling

The DropdownMenu component matches the visual style of Button.vue:

- **Menu container**: White background, black border, shadow
- **Menu items**: Uppercase text, wide tracking, monospace font
- **Default state**: Black text on white background
- **Hover/Focus state**: White text on black background (inverted)
- **Disabled state**: Gray text, gray background, no interaction
- **Transitions**: Smooth fade and scale animations

### CSS Classes Applied

Menu container:

```
absolute z-50 mt-2 min-w-[12rem] bg-white border border-black shadow-lg
```

Menu items:

```
w-full text-left px-4 py-2 text-xs uppercase tracking-widest transition-colors
hover:bg-black hover:text-white
```

Disabled items:

```
text-gray-400 cursor-not-allowed bg-gray-50
```

## Examples

### Basic dropdown with Button trigger

```vue
<DropdownMenu :items="menuItems" @select="handleSelect">
  <template #trigger>
    <Button text="Options" />
  </template>
</DropdownMenu>
```

### Right-aligned dropdown

```vue
<DropdownMenu :items="menuItems" align="right">
  <template #trigger>
    <Button text="User Menu" />
  </template>
</DropdownMenu>
```

### Hover-triggered dropdown

```vue
<DropdownMenu :items="menuItems" openOn="hover">
  <template #trigger>
    <Button text="Hover Me" />
  </template>
</DropdownMenu>
```

### Custom item rendering

```vue
<DropdownMenu :items="menuItems">
  <template #trigger>
    <Button text="Custom Items" />
  </template>
  <template #item="{ item, select }">
    <button @click="select" class="flex items-center gap-2 px-4 py-2">
      <Icon :name="item.icon" />
      <span>{{ item.label }}</span>
      <Badge v-if="item.badge" :text="item.badge" />
    </button>
  </template>
</DropdownMenu>
```

### Programmatic control

```vue
<script setup>
import { ref } from 'vue'

const dropdownRef = ref()
const menuItems = [
  { id: '1', label: 'Action 1' },
  { id: '2', label: 'Action 2' },
]

function openDropdown() {
  dropdownRef.value.open()
}
</script>

<template>
  <DropdownMenu ref="dropdownRef" :items="menuItems">
    <template #trigger>
      <Button text="Menu" />
    </template>
  </DropdownMenu>

  <Button text="Open Menu Programmatically" @click="openDropdown" />
</template>
```
