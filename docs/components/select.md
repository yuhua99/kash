# Select

## Usage

```vue
<script setup>
import { Select } from "@/components/ui"
import { ref } from "vue"

const value = ref("")
const options = [
  { label: "Option 1", value: "1" },
  { label: "Option 2", value: "2" },
]
</script>

<template>
  <Select v-model="value" :options="options" label="Choose an option" />
  <Select
    v-model="value"
    :options="options"
    searchable
    label="Searchable Select"
  />
</template>
```

## Props

| Prop          | Type                | Default           | Description                        |
| ------------- | ------------------- | ----------------- | ---------------------------------- |
| `modelValue`  | `T \| null`         | `null`            | The selected value                 |
| `options`     | `SelectOption<T>[]` | `[]`              | Array of options                   |
| `label`       | `string`            | -                 | Label text                         |
| `placeholder` | `string`            | `"Select option"` | Placeholder when no value selected |
| `searchable`  | `boolean`           | `false`           | Enable search functionality        |
| `disabled`    | `boolean`           | `false`           | Disables the select                |
| `error`       | `string`            | -                 | Error message                      |
| `required`    | `boolean`           | `false`           | Marks label with asterisk          |

## Events

| Event               | Payload | Description                    |
| ------------------- | ------- | ------------------------------ |
| `update:modelValue` | `T`     | Emitted when selection changes |
| `change`            | `T`     | Alias for update:modelValue    |
