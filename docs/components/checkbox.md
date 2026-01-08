# Checkbox

## Usage

```vue
<script setup>
import { Checkbox } from "@/components/ui"
import { ref } from "vue"

const accepted = ref(false)
</script>

<template>
  <Checkbox v-model="accepted" label="I accept terms and conditions" />
</template>
```

## Props

| Prop         | Type      | Default          | Description                           |
| ------------ | --------- | ---------------- | ------------------------------------- |
| `modelValue` | `boolean` | -                | The checked state                     |
| `label`      | `string`  | -                | Label text displayed next to checkbox |
| `disabled`   | `boolean` | `false`          | Disables the checkbox                 |
| `error`      | `string`  | -                | Error message displayed below         |
| `id`         | `string`  | `auto-generated` | ID for label association              |

## Events

| Event               | Payload   | Description                        |
| ------------------- | --------- | ---------------------------------- |
| `update:modelValue` | `boolean` | Emitted when checked state changes |
