# DatePicker

## Usage

```vue
<script setup>
import { DatePicker } from "@/components/ui"
import { ref } from "vue"

const date = ref("2024-01-01")
</script>

<template>
  <DatePicker v-model="date" label="Start Date" />
</template>
```

## Props

| Prop         | Type      | Default | Description               |
| ------------ | --------- | ------- | ------------------------- |
| `modelValue` | `string`  | -       | Date string (YYYY-MM-DD)  |
| `label`      | `string`  | -       | Label text                |
| `min`        | `string`  | -       | Minimum date              |
| `max`        | `string`  | -       | Maximum date              |
| `disabled`   | `boolean` | `false` | Disables the input        |
| `error`      | `string`  | -       | Error message             |
| `required`   | `boolean` | `false` | Marks label with asterisk |

## Styling

Uses native `<input type="date">` styled to match the design system (black border, no radius). Includes a custom calendar icon pointer-event-through overlay.
