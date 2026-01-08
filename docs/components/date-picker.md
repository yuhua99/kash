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

| Prop          | Type      | Default | Description                               |
| ------------- | --------- | ------- | ----------------------------------------- |
| `modelValue`  | `string`  | -       | Date string (YYYY-MM-DD)                  |
| `label`       | `string`  | -       | Label text                                |
| `min`         | `string`  | -       | Minimum date (YYYY-MM-DD)                 |
| `max`         | `string`  | -       | Maximum date (YYYY-MM-DD)                 |
| `placeholder` | `string`  | -       | Placeholder text when no date is selected |
| `disabled`    | `boolean` | `false` | Disables the input                        |
| `error`       | `string`  | -       | Error message                             |
| `required`    | `boolean` | `false` | Marks label with asterisk                 |

## Styling

Custom calendar implementation styled to match the design system. Uses a popover calendar for date selection instead of the native browser picker.
