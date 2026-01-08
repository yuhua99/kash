# DataTable

## Usage

```vue
<script setup>
import { DataTable } from "@/components/ui"

const columns = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role", sortable: true },
  { key: "actions", label: "", align: "right" },
]

const data = [
  { name: "John", role: "Admin" },
  { name: "Jane", role: "User" },
]
</script>

<template>
  <DataTable :columns="columns" :data="data">
    <template #cell-name="{ value }">
      <b>{{ value }}</b>
    </template>
    <template #cell-actions="{ row }">
      <button @click="edit(row)">Edit</button>
    </template>
  </DataTable>
</template>
```

## Props

| Prop            | Type                      | Default                | Description                 |
| --------------- | ------------------------- | ---------------------- | --------------------------- |
| `columns`       | `Column[]`                | `[]`                   | Column definitions          |
| `data`          | `T[]`                     | `[]`                   | Data array                  |
| `loading`       | `boolean`                 | `false`                | Show loading state          |
| `emptyMessage`  | `string`                  | `"No data available."` | Message when data is empty  |
| `sortColumn`    | `string`                  | -                      | Currently sorted column key |
| `sortDirection` | `'asc' \| 'desc' \| null` | `null`                 | Sort direction              |

## Column Definition

```ts
interface Column {
  key: string
  label: string
  align?: "left" | "center" | "right"
  sortable?: boolean
}
```

## Slots

| Slot         | Scope                    | Description                          |
| ------------ | ------------------------ | ------------------------------------ |
| `cell-{key}` | `{ row: T, value: any }` | Custom rendering for specific column |
