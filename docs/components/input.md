# Input

## Usage

```vue
<script setup>
import { Input } from "@/components/ui"
import { ref } from "vue"

const name = ref("")
</script>

<template>
  <Input v-model="name" label="Full Name" placeholder="Enter your name" />
  <Input
    v-model="email"
    label="Email"
    type="email"
    error="Invalid email address"
  />
</template>
```

## Props

| Prop          | Type               | Default          | Description                         |
| ------------- | ------------------ | ---------------- | ----------------------------------- |
| `modelValue`  | `string \| number` | -                | The input value                     |
| `label`       | `string`           | -                | Label text displayed above input    |
| `type`        | `string`           | `"text"`         | HTML input type                     |
| `placeholder` | `string`           | -                | Placeholder text                    |
| `error`       | `string`           | -                | Error message displayed below input |
| `helpText`    | `string`           | -                | Helper text displayed below input   |
| `disabled`    | `boolean`          | `false`          | Disables the input                  |
| `required`    | `boolean`          | `false`          | Marks label with asterisk           |
| `id`          | `string`           | `auto-generated` | ID for label association            |

## Events

| Event               | Payload            | Description                |
| ------------------- | ------------------ | -------------------------- |
| `update:modelValue` | `string \| number` | Emitted when value changes |
| `blur`              | `FocusEvent`       | Emitted on blur            |
| `focus`             | `FocusEvent`       | Emitted on focus           |
