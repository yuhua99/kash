# Form

## Usage

```vue
<script setup>
import { Form, Button } from "@/components/ui"

const handleSubmit = () => {
  // Handle submit
}
</script>

<template>
  <Form @submit="handleSubmit">
    <!-- Form fields -->
    <Button type="submit" text="Submit" />
  </Form>
</template>
```

## Props

| Prop    | Type     | Default | Description            |
| ------- | -------- | ------- | ---------------------- |
| `class` | `string` | -       | Additional CSS classes |

## Events

| Event    | Payload | Description                                    |
| -------- | ------- | ---------------------------------------------- |
| `submit` | `Event` | Emitted on form submission (prevented default) |
