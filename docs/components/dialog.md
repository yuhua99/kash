# Dialog

## Usage

```vue
<script setup>
import { Dialog, Button } from "@/components/ui"
import { ref } from "vue"

const isOpen = ref(false)
</script>

<template>
  <Button text="Open Dialog" @click="isOpen = true" />

  <Dialog
    v-model:open="isOpen"
    title="Dialog Title"
    description="Subtitle text"
  >
    <p>Dialog content goes here.</p>

    <template #footer>
      <Button text="Close" @click="isOpen = false" />
      <Button text="Save" @click="save" />
    </template>
  </Dialog>
</template>
```

## Props

| Prop          | Type      | Default      | Description                   |
| ------------- | --------- | ------------ | ----------------------------- |
| `open`        | `boolean` | `false`      | Controls visibility (v-model) |
| `title`       | `string`  | -            | Dialog header title           |
| `description` | `string`  | -            | Dialog sub-header description |
| `maxWidth`    | `string`  | `"max-w-lg"` | Tailwind class for max width  |

## Features

- Teleports to `body`
- Locks body scroll
- Focus trap (via autofocus)
- Close on Escape key
- Explicit close button (top right X)
- **Does NOT close on backdrop click** (by design)
